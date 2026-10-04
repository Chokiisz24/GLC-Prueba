/* Prueba el envio de correo con la configuracion SMTP.
 *   npm run mail:test -- tucorreo@gmail.com      (lee .env.local) */
import { readFileSync, existsSync } from 'node:fs';
import nodemailer from 'nodemailer';

if (existsSync('.env.local')) for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const to = process.argv[2];
const { SMTP_HOST = 'smtp.gmail.com', SMTP_PORT = '465', SMTP_USER, SMTP_PASS = '', SMTP_NAME = 'GLC' } = process.env;
if (!to) { console.log('Uso: npm run mail:test -- tucorreo@gmail.com'); process.exit(1); }
if (!SMTP_USER || !SMTP_PASS) { console.log('X Faltan SMTP_USER o SMTP_PASS'); process.exit(1); }
const pass = SMTP_PASS.replace(/\s/g, '');
console.log(`Usuario ${SMTP_USER}, clave de ${pass.length} caracteres (debe ser 16)`);
try {
  await nodemailer.createTransport({ host: SMTP_HOST, port: +SMTP_PORT, secure: +SMTP_PORT === 465, auth: { user: SMTP_USER, pass } })
    .sendMail({ from: { name: SMTP_NAME, address: SMTP_USER }, to, subject: 'Prueba GLC', text: 'Si lees esto, el envio de correos funciona.' });
  console.log(`OK Enviado a ${to}. Revisa bandeja y spam.`);
} catch (e) { console.log('X Fallo:', e.message); }
