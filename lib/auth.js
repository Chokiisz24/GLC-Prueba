/* lib/auth.js - Usuario actual, roles y super administrador. */
import { cache } from 'react';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { one, q, now } from './db';
import { getSession } from './session';

// ---- SUPER ADMINISTRADOR (programador): se configura con variables de entorno, nunca se registra.
// SUPER_HASH_B64 = hash bcrypt en base64 (generalo con: npm run hash -- 'TuContrasena'). El base64 evita
// que el signo $ del hash se rompa en archivos .env.
export const SUPER_EMAIL = (process.env.SUPER_EMAIL || '').trim().toLowerCase();
export const SUPER_HASH = (() => {
  const b = process.env.SUPER_HASH_B64;
  const h = b ? Buffer.from(b, 'base64').toString('utf8').trim() : (process.env.SUPER_HASH || '').trim();
  return h.replace(/^\$2y\$/, '$2b$'); // los hashes de PHP ($2y$) son equivalentes a $2b$
})();

const FAKE_HASH = '$2b$10$abcdefghijklmnopqrstuuYb3rzq7Wc3m8Zl8m9Qe0vK0dQy1Gm2a'; // evita ataques por tiempo

export async function pwVerify(pw, hash) {
  try { return await bcrypt.compare(String(pw ?? ''), hash || FAKE_HASH); } catch { return false; }
}
export const pwHash = (pw) => bcrypt.hash(pw, 10);
export const pwOk = (pw) => typeof pw === 'string' && pw.length >= 10 && /\d/.test(pw) && /[A-Za-z]/.test(pw);

// Huella de la contrasena guardada en la sesion: si la contrasena cambia, las sesiones viejas dejan de valer
export const passPrint = (u) => (u.email === SUPER_EMAIL ? SUPER_HASH : u.pass || '').slice(-10);

export const me = cache(async () => {
  const s = await getSession();
  if (!s.uid) return null;
  const u = await one('SELECT * FROM users WHERE id = $1', [s.uid]);
  if (!u || s.pv !== passPrint(u)) return null;
  return u;
});

export const isSuper = (u) => !!u && !!SUPER_EMAIL && u.email === SUPER_EMAIL;
export const isAdmin = (u) => !!u && u.role === 'admin';

// Registro oculto del super admin: existe en BD solo para que sus comentarios/subidas funcionen.
export async function superRow() {
  await q(`INSERT INTO users(email, pass, role, verified, approved, hidden, name, nick, city, country, age, "year", version, color, mods, created)
           VALUES($1, '!', 'admin', true, true, true, 'Super Admin', 'SuperAdmin', '-', '-', 99, 2000, '-', '-', '-', $2)
           ON CONFLICT(email) DO NOTHING`, [SUPER_EMAIL, now()]);
  await q(`UPDATE users SET role = 'admin', hidden = true, verified = true, approved = true, "rank" = 0, title = '' WHERE email = $1`, [SUPER_EMAIL]);
  return one('SELECT * FROM users WHERE email = $1', [SUPER_EMAIL]);
}

// Para paginas: si el perfil esta incompleto, manda a completarlo (como hacia index.php)
export async function pageUser() {
  const u = await me();
  if (u && (!u.name || !u.nick)) redirect('/profile');
  return u;
}

// A donde ir despues de entrar
export const homeFor = (u) => (isSuper(u) ? '/admin' : !u.name ? '/profile' : u.approved ? '/' : '/pending');
