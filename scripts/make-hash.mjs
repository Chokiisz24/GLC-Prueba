/* Genera el hash del super administrador.
 *   npm run hash -- 'TuContrasenaSegura123'
 * Copia la linea SUPER_HASH_B64=... en .env.local y en las variables de entorno de Vercel. */
import bcrypt from 'bcryptjs';

const pw = process.argv[2] || '';
if (pw.length < 10 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) {
  console.log("Uso: npm run hash -- 'TuContrasena'   (minimo 10 caracteres, con letras y numeros)");
  process.exit(1);
}
const hash = await bcrypt.hash(pw, 12);
console.log('\nCopia esta linea en tus variables de entorno:\n');
console.log('SUPER_HASH_B64=' + Buffer.from(hash).toString('base64') + '\n');
