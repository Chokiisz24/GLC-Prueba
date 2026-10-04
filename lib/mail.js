/* lib/mail.js - Envio de correo por SMTP (Gmail con contrasena de aplicacion).
 * Las credenciales viven SOLO en variables de entorno, nunca en el codigo. */
import nodemailer from 'nodemailer';

export const DEBUG_MAIL = process.env.DEBUG_MAIL === 'true';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

export async function sendMail(to, subject, text) {
  to = String(to).replace(/[\r\n]/g, '');
  subject = String(subject).replace(/[\r\n]/g, ''); // anti inyeccion de cabeceras
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
  if (!user || !pass) { console.warn(`[correo NO enviado: falta SMTP_USER/SMTP_PASS] ${to} | ${subject}`); return false; }
  const port = Number(process.env.SMTP_PORT || 465);
  try {
    const tr = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } });
    await tr.sendMail({ from: { name: process.env.SMTP_NAME || 'Guadalajara Lancer Club', address: user }, to, subject, text });
    return true;
  } catch (e) {
    console.error('Error SMTP:', e.message);
    return false;
  }
}

export const codeMail = (email, code) =>
  sendMail(email, `Tu codigo GLC: ${code}`, `Tu codigo de verificacion es ${code}\nExpira en 10 minutos.`);

export const resetMail = (email, code) =>
  sendMail(email, `Recupera tu contrasena GLC: ${code}`, `Tu codigo para cambiar la contrasena es ${code}\nExpira en 10 minutos.\nSi no lo pediste, ignora este correo.`);

export const approvedMail = (email, nick) =>
  sendMail(email, 'Tu cuenta GLC fue aceptada',
    `Hola ${nick},\n\n¡Tu solicitud fue aceptada! Ya eres miembro oficial del Guadalajara Lancer Club.\n` +
    (SITE_URL ? `Ingresa aqui: ${SITE_URL}/login\n` : '') + '\nBienvenido a la familia GLC.');
