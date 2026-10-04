/* lib/db.js - Conexion a Postgres (Neon en Vercel) y creacion automatica de tablas.
 * Todas las consultas son PARAMETRIZADAS ($1, $2...) -> sin SQL injection. */
import pg from 'pg';

pg.types.setTypeParser(20, (v) => Number(v)); // BIGINT y COUNT(*) llegan como numero, no como texto

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const g = globalThis;
const pool = (g.__glcPool ??= new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10000 }));

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, pass TEXT, role TEXT NOT NULL DEFAULT 'member',
  title TEXT NOT NULL DEFAULT '', "rank" INTEGER NOT NULL DEFAULT 99,
  verified BOOLEAN NOT NULL DEFAULT false, approved BOOLEAN NOT NULL DEFAULT false, hidden BOOLEAN NOT NULL DEFAULT false,
  name TEXT, nick TEXT, city TEXT, country TEXT, age INTEGER, "year" INTEGER, version TEXT, color TEXT, mods TEXT,
  photo TEXT, car_photo TEXT, bio TEXT, totp TEXT, created BIGINT NOT NULL);
DO $$ BEGIN
  -- Directiva separada del rol de admin. La primera vez, los administradores actuales pasan a Directiva
  -- (asi se ve igual que antes); despues el super admin decide quien aparece.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'board') THEN
    ALTER TABLE users ADD COLUMN board BOOLEAN NOT NULL DEFAULT false;
    UPDATE users SET board = true WHERE role = 'admin' AND NOT hidden AND name IS NOT NULL;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS codes(email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires BIGINT NOT NULL, tries INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS attempts(ip TEXT, email TEXT, t BIGINT);
CREATE INDEX IF NOT EXISTS attempts_t ON attempts(t);
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS media(id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  "type" TEXT, file TEXT, descr TEXT, created BIGINT);
CREATE TABLE IF NOT EXISTS comments(id SERIAL PRIMARY KEY, media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, body TEXT, created BIGINT);
CREATE TABLE IF NOT EXISTS events(id SERIAL PRIMARY KEY, title TEXT, "date" TEXT, "time" TEXT, place TEXT, maps_url TEXT,
  descr TEXT, flyer TEXT, user_id INTEGER, created BIGINT);
CREATE TABLE IF NOT EXISTS garage(id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  "type" TEXT, file TEXT, caption TEXT, created BIGINT);
CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT, descr TEXT, price TEXT, contact TEXT, photo TEXT, created BIGINT);
`;

// Crea las tablas la primera vez que se usa la BD en cada arranque (igual que hacia core.php con SQLite)
let ready;
function ensureSchema() {
  if (!url) throw new Error('Falta DATABASE_URL (conecta una base de datos Neon/Postgres en Vercel).');
  ready ??= pool.query(SCHEMA).catch((e) => { ready = undefined; throw e; });
  return ready;
}

export async function q(sql, params = []) {
  await ensureSchema();
  return (await pool.query(sql, params)).rows;
}
export async function one(sql, params = []) {
  return (await q(sql, params))[0] ?? null;
}
export const now = () => Math.floor(Date.now() / 1000);
