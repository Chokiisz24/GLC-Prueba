/* app/api/upload/route.js - Autoriza subidas directas del navegador a Vercel Blob.
 * Solo usuarios con permiso, solo a su propia carpeta (glc/u<ID>/), solo tipos y tamanos permitidos. */
import { handleUpload } from '@vercel/blob/client';
import { me, isSuper } from '@/lib/auth';
import { IMG_TYPES, VID_TYPES, MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';
import { blobToken } from '@/lib/blob';

const hasToken = () => /^vercel_blob_rw_/.test(blobToken());
// El ID del store va dentro de la llave: vercel_blob_rw_<STORE>_<secreto>. No es secreto (aparece en las URLs publicas).
const tokenStore = () => blobToken().split('_')[3] || '';
const envStore = () => (process.env.BLOB_STORE_ID || '').trim().replace(/^["']|["']$/g, '').replace(/^store_/, '');

// Diagnostico: si una subida falla, el navegador pregunta aqui el motivo (no revela ningun secreto)
export async function GET(request) {
  const kind = new URL(request.url).searchParams.get('kind') || '';
  const u = await me().catch(() => null);
  let reason = '';
  if (!hasToken()) reason = 'El servidor no tiene configurado BLOB_READ_WRITE_TOKEN. Conecta un Blob Store al proyecto en Vercel (pestaña Storage) y vuelve a desplegar (Redeploy). En local, copia la variable a .env.local y reinicia "npm run dev".';
  else if (envStore() && tokenStore() !== envStore())
    reason = `La llave BLOB_READ_WRITE_TOKEN es de otro store (store_${tokenStore()}), pero tu Blob Store es store_${envStore()}. Copia la llave correcta desde Storage → tu store → .env.local → Show secret, reemplázala y vuelve a desplegar.`;
  else if (!u) reason = 'Tu sesión expiró. Vuelve a iniciar sesión.';
  else if (kind === 'site' && !isSuper(u)) reason = 'Solo el super administrador puede cambiar las imágenes del sitio.';
  else if (kind !== 'profile' && !u.approved) reason = 'Tu cuenta está pendiente de aprobación.';
  else if (kind === '__store') reason = `Vercel dice que el store de tu llave no existe. Tu llave apunta a store_${tokenStore()}: compáralo con el Store ID que ves en Storage. Si no coincide, copia la llave correcta (Show secret), reemplázala en las variables de entorno y vuelve a desplegar.`;
  else reason = 'Vercel rechazó la subida. Revisa que el Blob Store sea de acceso "Public" y que BLOB_READ_WRITE_TOKEN sea el de ese store; los detalles están en Vercel → Logs.';
  return Response.json({ reason });
}

export async function POST(request) {
  const body = await request.json();
  try {
    if (!hasToken() && body?.type === 'blob.generate-client-token') throw new Error('Falta BLOB_READ_WRITE_TOKEN en las variables de entorno.');
    if (envStore() && tokenStore() !== envStore()) throw new Error(`BLOB_READ_WRITE_TOKEN es del store ${tokenStore()} pero BLOB_STORE_ID es ${envStore()}.`);
    const json = await handleUpload({
      token: blobToken() || undefined,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const u = await me();
        if (!u) throw new Error('Inicia sesion para subir archivos.');
        const { kind } = JSON.parse(clientPayload || '{}');
        if (!pathname.startsWith(`glc/u${u.id}/`)) throw new Error('Ruta de archivo no permitida.');
        if (kind === 'site' && !isSuper(u)) throw new Error('Sin permiso.');
        if (kind !== 'profile' && !u.approved) throw new Error('Tu cuenta esta pendiente de aprobacion.');
        const video = kind === 'media';
        return {
          allowedContentTypes: Object.keys(video ? { ...IMG_TYPES, ...VID_TYPES } : IMG_TYPES),
          maximumSizeInBytes: (video ? MAX_VIDEO_MB : MAX_IMG_MB) * 1048576,
          addRandomSuffix: true,
          tokenPayload: String(u.id),
        };
      },
    });
    return Response.json(json);
  } catch (e) {
    console.error('[subida] rechazada:', e.message); // visible en Vercel → Logs
    return Response.json({ error: e.message }, { status: 400 });
  }
}
