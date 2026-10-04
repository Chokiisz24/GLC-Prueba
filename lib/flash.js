/* lib/flash.js - Mensajes de un solo uso (exito/error) que se muestran despues de una accion. */
import { cookies } from 'next/headers';

export async function flash(m, t = 'ok') {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  (await cookies()).set('glc_f', JSON.stringify({ id, m, t }), { path: '/', maxAge: 60, sameSite: 'lax' }); // sin HttpOnly: el navegador lo borra al mostrarlo
}

export async function readFlash() {
  const v = (await cookies()).get('glc_f')?.value;
  if (!v) return null;
  try { const f = JSON.parse(v); return typeof f?.m === 'string' ? f : null; } catch { return null; }
}
