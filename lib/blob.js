/* lib/blob.js - Archivos en Vercel Blob. El navegador sube directo a Blob (asi caben videos de 100 MB);
 * el servidor solo acepta URLs de NUESTRO almacen y dentro de la carpeta del usuario que hace la accion. */
import { del } from '@vercel/blob';
import { after } from 'next/server';
// Llave limpia: tolera espacios y comillas pegadas por error desde el snippet ".env.local" de Vercel
export const blobToken = () => (process.env.BLOB_READ_WRITE_TOKEN || '').trim().replace(/^["']|["']$/g, '').trim();
export { IMG_TYPES, VID_TYPES, MAX_IMG_MB, MAX_VIDEO_MB } from './limits';

export function blobOk(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(u.hostname)
      && u.pathname.startsWith('/glc/') && !/["'()\\\s<>]/.test(url);
  } catch { return false; }
}

export const isVideo = (url) => /\.(mp4|webm)$/i.test(new URL(url).pathname);

// Lee un campo de archivo ya subido: valida dominio, carpeta del usuario y extension. Devuelve URL o null.
export function fileField(fd, name, uid, { video = false, required = true } = {}) {
  const v = fd.get(name);
  if (typeof v !== 'string' || v === '') {
    if (required) throw new UserError('Falta un archivo obligatorio.');
    return null;
  }
  const ok = blobOk(v) && new URL(v).pathname.startsWith(`/glc/u${uid}/`)
    && (video ? /\.(jpg|png|webp|mp4|webm)$/i : /\.(jpg|png|webp)$/i).test(new URL(v).pathname);
  if (!ok) throw new UserError('Formato de archivo no permitido.');
  return v;
}

// Borra archivos de Blob DESPUES de responder al usuario (no lo hace esperar)
export async function rmfile(...urls) {
  const list = urls.flat().filter((u) => u && blobOk(u));
  if (!list.length) return;
  after(async () => {
    try { await del(list, { token: blobToken() || undefined }); } catch (e) { console.error('No se pudo borrar de Blob:', e.message); }
  });
}

// Error mostrado al usuario como aviso rojo
export class UserError extends Error {}
