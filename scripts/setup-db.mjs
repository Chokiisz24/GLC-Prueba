/* Crea las tablas en la base de datos (opcional: el sitio tambien las crea solo en la primera visita).
 *   npm run db:setup      (lee DATABASE_URL de .env.local) */
import { readFileSync, existsSync } from 'node:fs';
import pg from 'pg';

if (existsSync('.env.local')) for (const l of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.log('Falta DATABASE_URL'); process.exit(1); }
const src = readFileSync(new URL('../lib/db.js', import.meta.url), 'utf8');
const schema = /SCHEMA = `([\s\S]*?)`;/.exec(src)[1];
const c = new pg.Client({ connectionString: url });
await c.connect(); await c.query(schema); await c.end();
console.log('Tablas listas.');
