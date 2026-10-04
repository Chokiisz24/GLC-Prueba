/* lib/session.js - Sesion en cookie firmada (JWT HS256), HttpOnly + SameSite=Lax + Secure en produccion.
 * Reemplaza $_SESSION de PHP: uid, pend (registro), pend_reset, tf (2FA pendiente), totp_new. */
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const NAME = 'glc_s';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function key() {
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
    return new TextEncoder().encode('solo-desarrollo-local-cambia-SESSION_SECRET-0000');
  }
  return new TextEncoder().encode(s);
}

export async function getSession() {
  const t = (await cookies()).get(NAME)?.value;
  if (!t) return {};
  try { return (await jwtVerify(t, key(), { algorithms: ['HS256'] })).payload; } catch { return {}; }
}

async function write(data) {
  const clean = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined && v !== null && !['iat', 'exp'].includes(k)));
  const jar = await cookies();
  if (!Object.keys(clean).length) { jar.delete(NAME); return; }
  const token = await new SignJWT(clean).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  jar.set(NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE });
}

// Mezcla cambios en la sesion. Un valor null/undefined borra esa clave.
export async function updateSession(patch) { await write({ ...(await getSession()), ...patch }); }
// Sesion nueva y limpia (equivale a session_regenerate_id + asignar uid)
export async function newSession(data) { await write(data); }
export async function destroySession() { (await cookies()).delete(NAME); }
