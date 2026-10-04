/* app/api/upload/route.js - Autoriza subidas directas del navegador a Vercel Blob.
 * Solo usuarios con permiso, solo a su propia carpeta (glc/u<ID>/), solo tipos y tamanos permitidos. */
import { handleUpload } from '@vercel/blob/client';
import { me, isSuper } from '@/lib/auth';
import { IMG_TYPES, VID_TYPES, MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';

export async function POST(request) {
  const body = await request.json();
  try {
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
    return Response.json({ error: e.message }, { status: 400 });
  }
}
