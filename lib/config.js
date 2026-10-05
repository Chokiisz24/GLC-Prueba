/* lib/config.js - Constantes del sitio y lectura de la configuracion editable (tabla settings). */
import { cache } from 'react';
import { q } from './db';

export const VERSIONS = ['DE', 'ES', 'GTS', 'GTS Sun & Sound', 'Ralliart', 'Evo X'];
export const FONTS = ['-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 'Arial, sans-serif', 'Georgia, serif', 'Verdana, sans-serif', '"Courier New", monospace'];
export const TZ = 'America/Mexico_City';

/* Redes sociales: [nombre, dominios permitidos, icono SVG]. Los enlaces los edita el super admin. */
export const SOCIAL = {
  facebook: ['Facebook', ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'fb.me'], '<svg viewBox="0 0 24 24"><path d="M14 8V6.5c0-.8.4-1.5 1.5-1.5H17V2h-2.5C11.8 2 10 3.8 10 6.3V8H7.5v3.2H10V22h4V11.2h2.8l.5-3.2z"/></svg>'],
  instagram: ['Instagram', ['instagram.com', 'www.instagram.com'], '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2"/></svg>'],
  tiktok: ['TikTok', ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'], '<svg viewBox="0 0 24 24"><path d="M16 3c.3 2.2 1.7 3.6 4 3.8v3c-1.5 0-2.9-.5-4-1.3V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.2a2.9 2.9 0 1 0 2 2.7V3z"/></svg>'],
  youtube: ['YouTube', ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'], '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z"/></svg>'],
  whatsapp: ['WhatsApp', ['wa.me', 'api.whatsapp.com', 'chat.whatsapp.com', 'whatsapp.com'], '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .7c-1-.4-1.8-1.2-2.2-2.2l.7-1-1-2z"/></svg>'],
};

// Redes de un miembro: JSON {facebook:'https://...'} -> solo claves conocidas con valor de texto
export function parseSocials(raw) {
  try { const o = JSON.parse(raw || '{}'); return Object.fromEntries(Object.keys(SOCIAL).filter((k) => typeof o[k] === 'string' && o[k]).map((k) => [k, o[k]])); }
  catch { return {}; }
}

export const DEFAULTS = {
  club_name: 'Guadalajara Lancer Club',
  hero_eyebrow: 'Guadalajara Lancer Club',
  hero_title: 'Pasión Lancer,\nunidos en Guadalajara',
  about_text: 'Somos una comunidad de apasionados por Mitsubishi Lancer en Guadalajara. Edita este texto desde el panel de administrador.',
  c_accent: '#d71920', c_bg: '', c_card: '', c_text: '', font: FONTS[0],
  bg_img: '', bg_dim: '60', hero_blend: '0', hero1: '', hero2: '', hero3: '',
};

// Toda la configuracion en una sola consulta (se reutiliza durante la misma peticion)
export const getSettings = cache(async () => {
  const rows = await q('SELECT k, v FROM settings');
  const s = { ...DEFAULTS };
  for (const r of rows) s[r.k] = r.v ?? '';
  if (!s.club_name) s.club_name = DEFAULTS.club_name;
  if (!FONTS.includes(s.font)) s.font = FONTS[0];
  for (const k of ['c_accent', 'c_bg', 'c_card', 'c_text']) if (s[k] && !/^#[0-9a-f]{6}$/i.test(s[k])) s[k] = DEFAULTS[k];
  if (!s.c_accent) s.c_accent = DEFAULTS.c_accent;
  return s;
});

export async function setcfg(k, v) {
  await q('INSERT INTO settings(k, v) VALUES($1, $2) ON CONFLICT(k) DO UPDATE SET v = excluded.v', [k, v]);
}

// Fecha de hoy en Guadalajara (el servidor de Vercel trabaja en UTC)
export const todayMx = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function fdate(d) {
  const [y, m, day] = d.split('-').map(Number);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const ms = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]} ${day} de ${ms[m - 1]} de ${y}`;
}

export const fdatetime = (sec) => new Intl.DateTimeFormat('es-MX', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(sec * 1000));
