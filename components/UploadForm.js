'use client';
/* Formulario con archivos: sube cada archivo DIRECTO a Vercel Blob (con barra de progreso) y luego
 * envia el formulario a la Server Action con las URLs. Asi se evitan los limites de tamano del servidor. */
import { useEffect, useRef, useState, useTransition } from 'react';
import { upload } from '@vercel/blob/client';
import { IMG_TYPES, VID_TYPES, MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';

export default function UploadForm({ action, uid, kind = 'image', className, style, children }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const ref = useRef(null), was = useRef(false);

  useEffect(() => { if (was.current && !pending) ref.current?.reset(); was.current = pending; }, [pending]);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy || pending) return;
    const form = e.currentTarget, fd = new FormData(form);
    setErr('');
    try {
      for (const inp of form.querySelectorAll('input[type=file]')) {
        const file = inp.files?.[0];
        fd.delete(inp.name);
        if (!file) continue;
        const k = inp.dataset.kind || kind, video = k === 'media';
        const ext = (video ? { ...IMG_TYPES, ...VID_TYPES } : IMG_TYPES)[file.type];
        if (!ext) throw new Error(`Formato no permitido. Usa JPG, PNG o WebP${video ? ', o video MP4/WebM' : ''}.`);
        const max = file.type.startsWith('video/') ? MAX_VIDEO_MB : MAX_IMG_MB;
        if (file.size > max * 1048576) throw new Error(`Archivo demasiado grande (maximo ${max} MB).`);
        setBusy(`Subiendo ${file.name}… 0%`);
        const res = await upload(`glc/u${uid}/${inp.name}.${ext}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ kind: k }),
          multipart: file.size > 10 * 1048576,
          onUploadProgress: ({ percentage }) => setBusy(`Subiendo ${file.name}… ${Math.round(percentage)}%`),
        });
        fd.set(inp.name, res.url);
      }
      setBusy('');
      start(() => action(fd));
    } catch (e) {
      setBusy('');
      let why = e?.message || 'error desconocido';
      if (/client token/i.test(why)) {             // la libreria oculta el motivo: lo preguntamos al servidor
        try { why = (await (await fetch('/api/upload?kind=' + kind)).json()).reason || why; } catch {}
      }
      setErr(`No se pudo subir: ${why}`);
    }
  }

  const status = pending ? 'Guardando…' : busy;
  return (
    <form ref={ref} className={className} style={style} onSubmit={onSubmit}>
      <fieldset disabled={!!status} style={{ display: 'contents' }}>{children}</fieldset>
      {status && <small aria-live="polite">{status}</small>}
      {err && <div className="msg err" style={{ margin: 0 }}>{err}</div>}
    </form>
  );
}
