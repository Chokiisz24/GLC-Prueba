/* lib/db.js - Conexion a Postgres (Neon en Vercel) y creacion automatica de tablas.
 * Todas las consultas son PARAMETRIZADAS ($1, $2...) -> sin SQL injection.
 *
 * Si no existe DATABASE_URL / POSTGRES_URL, el proyecto entra
 * automáticamente en MODO DEMO para poder trabajar localmente.
 */

import pg from 'pg';

pg.types.setTypeParser(20, (v) => Number(v));

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

/*
 * Esto nos permite saber desde cualquier archivo
 * si realmente tenemos una BD disponible.
 */
export const DB_ENABLED = Boolean(url);


/*
 * IMPORTANTE:
 * No creamos Pool si no existe URL.
 *
 * Antes se creaba:
 *
 * new pg.Pool({ connectionString: undefined })
 *
 * y después ensureSchema() terminaba lanzando el error.
 */
const g = globalThis;

const pool = DB_ENABLED
  ? (g.__glcPool ??= new pg.Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10000,
    }))
  : null;


export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, pass TEXT, role TEXT NOT NULL DEFAULT 'member',
  title TEXT NOT NULL DEFAULT '', "rank" INTEGER NOT NULL DEFAULT 99,
  verified BOOLEAN NOT NULL DEFAULT false, approved BOOLEAN NOT NULL DEFAULT false, hidden BOOLEAN NOT NULL DEFAULT false,
  name TEXT, nick TEXT, city TEXT, country TEXT, age INTEGER, "year" INTEGER, version TEXT, color TEXT, mods TEXT,
  photo TEXT, car_photo TEXT, bio TEXT, totp TEXT, created BIGINT NOT NULL);

ALTER TABLE users ADD COLUMN IF NOT EXISTS socials TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'board'
  ) THEN

    ALTER TABLE users
    ADD COLUMN board BOOLEAN NOT NULL DEFAULT false;

    UPDATE users
    SET board = true
    WHERE role = 'admin'
      AND NOT hidden
      AND name IS NOT NULL;

  END IF;
END $$;

CREATE TABLE IF NOT EXISTS codes(
  email TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  expires BIGINT NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attempts(
  ip TEXT,
  email TEXT,
  t BIGINT
);

CREATE INDEX IF NOT EXISTS attempts_t
ON attempts(t);

CREATE TABLE IF NOT EXISTS settings(
  k TEXT PRIMARY KEY,
  v TEXT
);

CREATE TABLE IF NOT EXISTS media(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  "type" TEXT,
  file TEXT,
  descr TEXT,
  created BIGINT
);

CREATE TABLE IF NOT EXISTS comments(
  id SERIAL PRIMARY KEY,
  media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  created BIGINT
);

CREATE TABLE IF NOT EXISTS events(
  id SERIAL PRIMARY KEY,
  title TEXT,
  "date" TEXT,
  "time" TEXT,
  place TEXT,
  maps_url TEXT,
  descr TEXT,
  flyer TEXT,
  user_id INTEGER,
  created BIGINT
);

CREATE TABLE IF NOT EXISTS garage(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  "type" TEXT,
  file TEXT,
  caption TEXT,
  created BIGINT
);

CREATE TABLE IF NOT EXISTS products(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  descr TEXT,
  price TEXT,
  contact TEXT,
  photo TEXT,
  created BIGINT
);
`;


/* =========================================================
   CREACIÓN DEL ESQUEMA
========================================================= */

let ready;

function ensureSchema() {

  /*
   * Si estamos trabajando sin BD,
   * no hacemos absolutamente nada.
   */
  if (!DB_ENABLED) {
    return Promise.resolve();
  }

  ready ??= pool
    .query(SCHEMA)
    .catch((e) => {

      ready = undefined;

      throw e;

    });

  return ready;
}


/* =========================================================
   CONSULTAS
========================================================= */

export async function q(sql, params = []) {

  /*
   * MODO DEMO:
   *
   * Todas las consultas SELECT reciben []
   * y el resto simplemente no hace nada.
   *
   * Esto permite cargar el sitio sin Postgres.
   */
  if (!DB_ENABLED) {
    return [];
  }

  await ensureSchema();

  return (
    await pool.query(sql, params)
  ).rows;
}


export async function one(sql, params = []) {

  return (
    await q(sql, params)
  )[0] ?? null;

}


export const now = () =>
  Math.floor(Date.now() / 1000);