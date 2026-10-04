/* lib/mail.js - Envio de correo por SMTP (Gmail con contrasena de aplicacion).
 * Las credenciales viven SOLO en variables de entorno. El resultado del ultimo envio se guarda
 * (sin datos secretos) para mostrarlo en el panel del super admin. */
import nodemailer from 'nodemailer';
import { q, now } from './db';

// Lee una variable tolerando espacios y comillas pegadas por error en el panel de Vercel
const env = (k) => (process.env[k] || '').trim().replace(/^["']|["']$/g, '').trim();

export const DEBUG_MAIL = env('DEBUG_MAIL') === 'true';
const SITE_URL = env('SITE_URL').replace(/\/$/, '');

export function mailConfig() {
  const port = Number(env('SMTP_PORT') || 465);
  return {
    host: env('SMTP_HOST') || 'smtp.gmail.com',
    port,
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS').replace(/\s/g, ''), // Google muestra la clave con espacios: se quitan
    name: env('SMTP_NAME') || 'Guadalajara Lancer Club',
  };
}

// Traduce los errores mas comunes de Gmail a algo accionable
function explain(e) {
  const m = String(e?.message || e);
  if (/535|Username and Password not accepted|Invalid login|BadCredentials/i.test(m))
    return 'Gmail rechazó el usuario o la contraseña. SMTP_USER debe ser tu Gmail completo y SMTP_PASS una CONTRASEÑA DE APLICACIÓN de 16 letras (no tu contraseña normal). Si la revocaste, crea otra en myaccount.google.com/apppasswords.';
  if (/534|Application-specific password required|WebLoginRequired/i.test(m))
    return 'Gmail exige una contraseña de aplicación: activa la verificación en 2 pasos de tu cuenta Google y crea una en myaccount.google.com/apppasswords.';
  if (/ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENOTFOUND|Greeting never received|timeout/i.test(m))
    return `No se pudo conectar a ${mailConfig().host}:${mailConfig().port}. Revisa SMTP_HOST y SMTP_PORT (Gmail: smtp.gmail.com y 465).`;
  if (/550|5\.7\.|quota|limit/i.test(m)) return 'Gmail bloqueó o limitó el envío (límite diario o mensaje rechazado). Detalle: ' + m;
  return m;
}

async function remember(ok, to, detail) {
  try {
    await q(`INSERT INTO settings(k, v) VALUES('mail_status', $1) ON CONFLICT(k) DO UPDATE SET v = excluded.v`,
      [JSON.stringify({ ok, t: now(), to: to.replace(/^(.).*(@.*)$/, '$1***$2'), detail })]);
  } catch {}
}

// Devuelve { ok, error }
export async function sendMail(to, subject, text) {
  to = String(to).replace(/[\r\n]/g, '');
  subject = String(subject).replace(/[\r\n]/g, ''); // anti inyeccion de cabeceras
  const c = mailConfig();
  if (!c.user || !c.pass) {
    const error = 'Faltan las variables SMTP_USER o SMTP_PASS en Vercel (Settings → Environment Variables), o no volviste a desplegar después de agregarlas.';
    console.error('[correo]', error);
    await remember(false, to, error);
    return { ok: false, error };
  }
  try {
    const tr = nodemailer.createTransport({
      host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
    await tr.sendMail({ from: { name: c.name, address: c.user }, to, subject, text });
    await remember(true, to, subject);
    return { ok: true };
  } catch (e) {
    const error = explain(e);
    console.error('[correo] fallo:', e?.message, '|', error);
    await remember(false, to, error);
    return { ok: false, error };
  }
}

export const codeMail = (email, code) =>
  sendMail(email, `Tu código GLC: ${code}`, `Tu código de verificación es ${code}\nExpira en 10 minutos.`);

export const resetMail = (email, code) =>
  sendMail(email, `Recupera tu contraseña GLC: ${code}`, `Tu código para cambiar la contraseña es ${code}\nExpira en 10 minutos.\nSi no lo pediste, ignora este correo.`);

export const approvedMail = (email, nick) =>
  sendMail(email, 'Tu cuenta GLC fue aceptada',
    `Hola ${nick},\n\n¡Tu solicitud fue aceptada! Ya eres miembro oficial del Guadalajara Lancer Club.\n` +
    (SITE_URL ? `Ingresa aquí: ${SITE_URL}/login\n` : '') + '\nBienvenido a la familia GLC.');
