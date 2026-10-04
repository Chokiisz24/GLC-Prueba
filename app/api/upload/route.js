/* app/api/upload/route.js - Autoriza subidas directas del navegador a Vercel Blob.
 * Solo usuarios con permiso, solo a su propia carpeta (glc/u<ID>/), solo tipos y tamanos permitidos. */
import { handleUpload } from '@vercel/blob/client';
import { me, isSuper } from '@/lib/auth';
import { IMG_TYPES, VID_TYPES, MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';

const hasToken = () => /^vercel_blob_rw_/.test(process.env.BLOB_READ_WRITE_TOKEN || '');

// Diagnostico: si una subida falla, el navegador pregunta aqui el motivo (no revela ningun secreto)
export async function GET(request) {
  const kind = new URL(request.url).searchParams.get('kind') || '';
  const u = await me().catch(() => null);
  let reason = '';
  if (!hasToken()) reason = 'El servidor no tiene configurado BLOB_READ_WRITE_TOKEN. Conecta un Blob Store al proyecto en Vercel (pestaña Storage) y vuelve a desplegar (Redeploy). En local, copia la variable a .env.local y reinicia "npm run dev".';
  else if (!u) reason = 'Tu sesión expiró. Vuelve a iniciar sesión.';
  else if (kind === 'site' && !isSuper(u)) reason = 'Solo el super administrador puede cambiar las imágenes del sitio.';
  else if (kind !== 'profile' && !u.approved) reason = 'Tu cuenta está pendiente de aprobación.';
  else reason = 'Vercel rechazó la subida. Revisa que el Blob Store sea de acceso "Public" y que BLOB_READ_WRITE_TOKEN sea el de ese store; los detalles están en Vercel → Logs.';
  return Response.json({ reason });
}

export async function POST(request) {
  const body = await request.json();
  try {
    if (!hasToken() && body?.type === 'blob.generate-client-token') throw new Error('Falta BLOB_READ_WRITE_TOKEN en las variables de entorno.');
    const json = await handleUpload({
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
