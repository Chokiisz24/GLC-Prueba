'use server';
/* =====================================================================
 * app/actions.js - Todas las acciones del sitio (equivale al bloque POST de index.php).
 * Cada accion valida permisos EN EL SERVIDOR. Next.js protege las Server Actions contra CSRF
 * comprobando el origen de la peticion.
 * ===================================================================== */
import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { q, one, now } from '@/lib/db';
import { me, isAdmin, isSuper, superRow, SUPER_EMAIL, SUPER_HASH, pwVerify, pwHash, pwOk, passPrint, homeFor } from '@/lib/auth';
import { getSession, updateSession, newSession, destroySession } from '@/lib/session';
import { flash } from '@/lib/flash';
import { codeMail, resetMail, approvedMail, sendMail, DEBUG_MAIL } from '@/lib/mail';
import { fileField, rmfile, isVideo, UserError } from '@/lib/blob';
import { VERSIONS, FONTS, SOCIAL, setcfg, getSettings } from '@/lib/config';
import { newSecret, totpOk } from '@/lib/totp';

/* ---------- utilidades ---------- */
const str = (fd, k) => { const v = fd.get(k); return typeof v === 'string' ? v : ''; };
const txt = (fd, k) => str(fd, k).trim();
const int = (fd, k) => parseInt(str(fd, k), 10) || 0;
const cut = (s, n) => [...s].slice(0, n).join('');
const len = (s) => [...s].length;
const emailOk = (e) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
}

// Ejecuta la accion: un UserError se muestra como aviso rojo y regresa a "back"; si todo sale bien va a la ruta devuelta.
async function run(back, fn) {
  const ctx = { back };
  let dest;
  try { dest = await fn(ctx); } catch (e) {
    if (e instanceof UserError) { await flash(e.message, 'err'); redirect(ctx.back); }
    throw e;
  }
  redirect(dest || ctx.back);
}

// Guardias de acceso (igual que en index.php: sin sesion solo se puede ver; pendiente solo edita su perfil)
async function member() {
  const u = await me();
  if (!u) { await flash('Inicia sesion para realizar esta accion.', 'err'); redirect('/login'); }
  if (!u.approved) { await flash('Tu cuenta esta pendiente de aprobacion.', 'err'); redirect('/pending'); }
  return u;
}
async function admin() { const u = await member(); if (!isAdmin(u)) redirect('/'); return u; }
async function superOnly() { const u = await member(); if (!isSuper(u)) redirect('/'); return u; }

// Limite de intentos: 5 por 15 minutos
async function tooMany(where, params) {
  await q('DELETE FROM attempts WHERE t < $1', [now() - 900]);
  return (await one(`SELECT COUNT(*) AS c FROM attempts WHERE ${where}`, params)).c >= 5;
}

// Codigos de 6 digitos (guardados hasheados, 10 min, 5 intentos)
async function makeCode(key) {
  const code = String(crypto.randomInt(100000, 1000000));
  await q(`INSERT INTO codes(email, hash, expires, tries) VALUES($1, $2, $3, 0)
           ON CONFLICT(email) DO UPDATE SET hash = excluded.hash, expires = excluded.expires, tries = 0`, [key, await pwHash(code), now() + 600]);
  if (DEBUG_MAIL) { await flash(`[MODO DEBUG] Codigo: ${code}`); console.log(`[DEBUG_MAIL] ${key} -> ${code}`); }
  return code;
}
async function checkCode(key, input, expiredMsg) {
  const c = await one('SELECT * FROM codes WHERE email = $1', [key]);
  if (!c || c.expires < now() || c.tries >= 5) throw new UserError(expiredMsg);
  await q('UPDATE codes SET tries = tries + 1 WHERE email = $1', [key]);
  if (!(await pwVerify(String(input).trim(), c.hash))) throw new UserError('Codigo incorrecto.');
  await q('DELETE FROM codes WHERE email = $1', [key]);
}

// Borra un usuario junto con todos sus archivos
async function purgeUser(x) {
  const files = [x.photo, x.car_photo];
  for (const r of await q('SELECT file FROM garage WHERE user_id = $1', [x.id])) files.push(r.file);
  for (const r of await q('SELECT file FROM media WHERE user_id = $1', [x.id])) files.push(r.file);
  for (const r of await q('SELECT photo FROM products WHERE user_id = $1', [x.id])) files.push(r.photo);
  await q('DELETE FROM users WHERE id = $1', [x.id]);
  await rmfile(files);
}

/* =================== CUENTA =================== */

/* LOGIN con limite de intentos (5 por 15 min por IP/correo) */
export async function login(fd) {
  await run('/login', async () => {
    const em = txt(fd, 'email').toLowerCase(), pw = str(fd, 'password'), ip = await clientIp();
    if (await tooMany('ip = $1 OR email = $2', [ip, em])) throw new UserError('Demasiados intentos. Espera 15 minutos.');
    const fail = async () => {
      await q('INSERT INTO attempts(ip, email, t) VALUES($1, $2, $3)', [ip, em, now()]);
      throw new UserError('Credenciales invalidas o correo sin verificar.');
    };
    let r;
    if (SUPER_EMAIL && em === SUPER_EMAIL) {                     // acceso del super administrador
      if (!SUPER_HASH || !(await pwVerify(pw, SUPER_HASH))) await fail();
      r = await superRow();
    } else {
      r = await one('SELECT * FROM users WHERE email = $1 AND hidden = false', [em]);
      const ok = await pwVerify(pw, r?.pass);                     // compara siempre (hash falso si no existe)
      if (!ok || !r || !r.verified) await fail();
    }
    await q('DELETE FROM attempts WHERE email = $1', [em]);
    if (r.totp) { await newSession({ tf: [r.id, now()] }); return '/twofa'; } // falta el codigo de la app
    await newSession({ uid: r.id, pv: passPrint(r) });
    return homeFor(r);
  });
}

export async function logout() {
  await destroySession();
  await flash('Sesion cerrada.');
  redirect('/');
}

/* REGISTRO paso 1: correo + contrasena -> envia codigo */
export async function register(fd) {
  await run('/login?tab=reg', async () => {
    const em = txt(fd, 'email').toLowerCase(), pw = str(fd, 'password');
    if (!emailOk(em)) throw new UserError('Correo invalido.');
    if (!pwOk(pw)) throw new UserError('La contrasena debe tener 10+ caracteres con letras y numeros.');
    if (em !== SUPER_EMAIL) {
      const ex = await one('SELECT verified FROM users WHERE email = $1', [em]);
      if (!ex || !ex.verified) {
        await q(`INSERT INTO users(email, pass, created) VALUES($1, $2, $3) ON CONFLICT(email) DO UPDATE SET pass = excluded.pass`, [em, await pwHash(pw), now()]);
        const sent = await codeMail(em, await makeCode(em));
        if (!sent.ok && !DEBUG_MAIL) throw new UserError('No pudimos enviar el código a tu correo en este momento. Intenta más tarde o avisa a un administrador del club.');
      }
    }
    await newSession({ pend: em });                              // un registro nuevo siempre empieza sin sesion previa
    if (!DEBUG_MAIL) await flash('Si el correo es valido, enviamos un codigo.'); // no revela si el correo existe
    return '/verify';
  });
}

/* REGISTRO paso 2: validar codigo */
export async function verifyEmail(fd) {
  await run('/verify', async () => {
    const em = (await getSession()).pend || '';
    await checkCode(em, txt(fd, 'code'), 'Codigo expirado o bloqueado. Registrate de nuevo.');
    await q('UPDATE users SET verified = true WHERE email = $1', [em]);
    // Sin super admin configurado, el primer usuario verificado se vuelve administrador y lider
    if (!SUPER_EMAIL && !(await one(`SELECT 1 FROM users WHERE role = 'admin'`)))
      await q(`UPDATE users SET role = 'admin', "rank" = 0, title = 'Lider', approved = true WHERE email = $1`, [em]);
    const u = await one('SELECT * FROM users WHERE email = $1', [em]);
    await newSession({ uid: u.id, pv: passPrint(u) });
    await flash('Correo verificado. Completa tu perfil.');
    return '/profile';
  });
}

/* REGISTRO paso 3: perfil (todo obligatorio) */
export async function saveProfile(fd) {
  await run('/profile', async () => {
    const u = await me();
    if (!u) return '/login';
    const d = {};
    for (const k of ['name', 'nick', 'city', 'country', 'color', 'mods']) {
      d[k] = txt(fd, k);
      if (!d[k] || len(d[k]) > (k === 'nick' ? 30 : 200)) throw new UserError('Todos los campos son obligatorios.');
    }
    const age = int(fd, 'age'), yr = int(fd, 'year'), ver = str(fd, 'version');
    const maxYear = new Date().getFullYear() + 1;
    if (age < 16 || age > 99 || yr < 2000 || yr > maxYear || !VERSIONS.includes(ver)) throw new UserError('Edad, año o version invalidos.');
    const socials = readSocials(fd);
    const ph = fileField(fd, 'photo', u.id, { required: !u.photo }) || u.photo;
    const cp = fileField(fd, 'car_photo', u.id, { required: !u.car_photo }) || u.car_photo;
    await q(`UPDATE users SET name=$1, nick=$2, city=$3, country=$4, age=$5, "year"=$6, version=$7, color=$8, mods=$9, photo=$10, car_photo=$11, socials=$12 WHERE id=$13`,
      [d.name, d.nick, d.city, d.country, age, yr, ver, d.color, d.mods, ph, cp, socials, u.id]);
    await rmfile(ph !== u.photo ? u.photo : null, cp !== u.car_photo ? u.car_photo : null);
    if (u.approved) { await flash('Perfil guardado.'); return '/members'; }
    await flash('Perfil enviado. Un administrador revisara tu solicitud.');
    return '/pending';
  });
}

/* RECUPERAR CONTRASENA (max 5 solicitudes / 15 min por IP) */
export async function forgot(fd) {
  await run('/forgot', async () => {
    const em = txt(fd, 'email').toLowerCase(), key = 'fp:' + (await clientIp());
    if (await tooMany('ip = $1', [key])) throw new UserError('Demasiadas solicitudes. Espera 15 minutos.');
    await q('INSERT INTO attempts(ip, email, t) VALUES($1, $2, $3)', [key, '', now()]);
    if (emailOk(em) && (await one('SELECT 1 FROM users WHERE email = $1 AND verified AND NOT hidden', [em])))
      if (!(await resetMail(em, await makeCode('reset:' + em))).ok && !DEBUG_MAIL)
        throw new UserError('No pudimos enviar el código en este momento. Intenta más tarde o avisa a un administrador del club.');
    await updateSession({ pend_reset: em });
    if (!DEBUG_MAIL) await flash('Si el correo existe, enviamos un codigo.');
    return '/reset';
  });
}

export async function resetPassword(fd) {
  await run('/reset', async () => {
    const em = (await getSession()).pend_reset || '', pw = str(fd, 'password');
    if (!pwOk(pw)) throw new UserError('La contrasena debe tener 10+ caracteres con letras y numeros.');
    await checkCode('reset:' + em, txt(fd, 'code'), 'Codigo expirado o bloqueado. Solicita uno nuevo.');
    await q('UPDATE users SET pass = $1 WHERE email = $2', [await pwHash(pw), em]); // las sesiones abiertas dejan de valer
    await updateSession({ pend_reset: null });
    await flash('Contrasena actualizada. Ya puedes iniciar sesion.');
    return '/login';
  });
}

/* VERIFICACION EN 2 PASOS */
export async function twofa(fd) {
  await run('/twofa', async () => {
    const tf = (await getSession()).tf;
    if (!Array.isArray(tf) || now() - tf[1] > 300) {
      await updateSession({ tf: null });
      await flash('Verificacion expirada. Inicia sesion de nuevo.', 'err');
      return '/login';
    }
    const k = '2fa:' + Number(tf[0]);
    if (await tooMany('email = $1', [k])) throw new UserError('Demasiados intentos. Espera 15 minutos.');
    const r = await one('SELECT * FROM users WHERE id = $1', [Number(tf[0])]);
    if (!r || !r.totp || !totpOk(r.totp, str(fd, 'code'))) {
      await q('INSERT INTO attempts(ip, email, t) VALUES(NULL, $1, $2)', [k, now()]);
      throw new UserError('Codigo incorrecto.');
    }
    await q('DELETE FROM attempts WHERE email = $1', [k]);
    await newSession({ uid: r.id, pv: passPrint(r) });
    return homeFor(r);
  });
}

export async function totpStart() {
  await member();
  await updateSession({ totp_new: newSecret() });
  redirect('/security');
}

export async function totpOn(fd) {
  await run('/security', async () => {
    const u = await member(), sec = (await getSession()).totp_new || '';
    if (!sec || !totpOk(sec, str(fd, 'code'))) throw new UserError('Codigo incorrecto. Revisa que la hora de tu telefono sea automatica.');
    await q('UPDATE users SET totp = $1 WHERE id = $2', [sec, u.id]);
    await updateSession({ totp_new: null });
    await flash('Verificacion en 2 pasos activada.');
  });
}

export async function totpOff(fd) {
  await run('/security', async () => {
    const u = await member();
    const okPw = await pwVerify(str(fd, 'password'), isSuper(u) ? SUPER_HASH : u.pass);
    if (!u.totp || !okPw || !totpOk(u.totp, str(fd, 'code'))) throw new UserError('Contrasena o codigo incorrectos.');
    await q('UPDATE users SET totp = NULL WHERE id = $1', [u.id]);
    await flash('Verificacion en 2 pasos desactivada.');
  });
}

// El super admin la quita a quien perdio su telefono
export async function totpReset(fd) {
  await superOnly();
  await q('UPDATE users SET totp = NULL WHERE id = $1 AND hidden = false', [int(fd, 'id')]);
  await flash('2FA desactivado para ese miembro.');
  redirect('/admin');
}

/* =================== MULTIMEDIA Y COMENTARIOS =================== */

export async function mediaUpload(fd) {
  await run('/media', async () => {
    const u = await member(), desc = txt(fd, 'descr');
    if (!desc) throw new UserError('Agrega una descripcion.');
    const f = fileField(fd, 'file', u.id, { video: true });
    await q('INSERT INTO media(user_id, "type", file, descr, created) VALUES($1, $2, $3, $4, $5)', [u.id, isVideo(f) ? 'video' : 'image', f, cut(desc, 500), now()]);
    await flash('Subido.');
    return '/media';
  });
}

export async function delMedia(fd) {
  await run('/media', async () => {
    const u = await member(), m = await one('SELECT * FROM media WHERE id = $1', [int(fd, 'id')]);
    if (m && (u.id === m.user_id || isSuper(u))) { await q('DELETE FROM media WHERE id = $1', [m.id]); await rmfile(m.file); await flash('Eliminado.'); }
    return '/media';
  });
}

export async function addComment(fd) {
  const mid = int(fd, 'mid');
  await run(`/media/${mid}`, async () => {
    const u = await member(), b = txt(fd, 'body');
    if (b && (await one('SELECT 1 FROM media WHERE id = $1', [mid])))
      await q('INSERT INTO comments(media_id, user_id, body, created) VALUES($1, $2, $3, $4)', [mid, u.id, cut(b, 500), now()]);
  });
}

/* Moderacion: autor del comentario, dueno de la foto/video o cualquier admin */
export async function delComment(fd) {
  await run('/media', async (ctx) => {
    const u = await member();
    const cm = await one('SELECT c.*, m.user_id AS owner FROM comments c JOIN media m ON m.id = c.media_id WHERE c.id = $1', [int(fd, 'id')]);
    if (!cm) return '/media';
    ctx.back = `/media/${cm.media_id}`;
    if (u.id === cm.user_id || u.id === cm.owner || isAdmin(u)) { await q('DELETE FROM comments WHERE id = $1', [cm.id]); await flash('Comentario eliminado.'); }
  });
}

/* =================== VENTAS =================== */

export async function productUpload(fd) {
  await run('/sales', async () => {
    const u = await member();
    const t = txt(fd, 'title'), pr = txt(fd, 'price'), ct = txt(fd, 'contact'), ds = txt(fd, 'descr');
    if (!t || !pr || !ct || !ds) throw new UserError('Completa titulo, descripcion, precio y contacto.');
    const photo = fileField(fd, 'photo', u.id);
    await q('INSERT INTO products(user_id, title, descr, price, contact, photo, created) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [u.id, cut(t, 100), cut(ds, 800), cut(pr, 40), cut(ct, 100), photo, now()]);
    await flash('Producto publicado.');
  });
}

export async function delProduct(fd) {
  await run('/sales', async () => {
    const u = await member(), r = await one('SELECT * FROM products WHERE id = $1', [int(fd, 'id')]);
    if (r && (u.id === r.user_id || isAdmin(u))) { await q('DELETE FROM products WHERE id = $1', [r.id]); await rmfile(r.photo); await flash('Producto eliminado.'); }
  });
}

/* =================== PAGINA PERSONAL DEL MIEMBRO (dueno o admin) =================== */

// Redes del miembro (campos ms_facebook, ms_instagram...): opcionales; solo https y del dominio de cada red. Devuelve JSON.
function readSocials(fd) {
  const out = {};
  for (const [k, [name, hosts]] of Object.entries(SOCIAL)) {
    const v = txt(fd, 'ms_' + k);
    if (!v) continue;
    let ok = false;
    try { const x = new URL(v); ok = v.length <= 300 && x.protocol === 'https:' && hosts.includes(x.hostname.toLowerCase()); } catch {}
    if (!ok) throw new UserError(`Enlace de ${name} invalido (debe empezar con https:// y ser de ${name}).`);
    out[k] = v;
  }
  return JSON.stringify(out);
}

async function canEdit(u, uid) {
  if (!(await one('SELECT 1 FROM users WHERE id = $1 AND hidden = false', [uid])) || (u.id !== uid && !isAdmin(u)))
    throw new UserError('No tienes permiso para modificar este perfil.');
}

export async function bioSave(fd) {
  const uid = int(fd, 'uid');
  await run(`/members/${uid}`, async () => {
    const u = await member();
    await canEdit(u, uid);
    await q('UPDATE users SET bio = $1, socials = $2 WHERE id = $3', [cut(txt(fd, 'bio'), 1000), readSocials(fd), uid]);
    await flash('Pagina guardada.');
  });
}

export async function garageUp(fd) {
  const uid = int(fd, 'uid');
  await run(`/members/${uid}`, async () => {
    const u = await member();
    await canEdit(u, uid);
    if ((await one('SELECT COUNT(*) AS c FROM garage WHERE user_id = $1', [uid])).c >= 60) throw new UserError('Limite de 60 archivos alcanzado. Elimina alguno primero.');
    const f = fileField(fd, 'file', u.id, { video: true });
    await q('INSERT INTO garage(user_id, "type", file, caption, created) VALUES($1, $2, $3, $4, $5)', [uid, isVideo(f) ? 'video' : 'image', f, cut(txt(fd, 'caption'), 200), now()]);
    await flash('Archivo agregado.');
  });
}

export async function garageDel(fd) {
  await run('/members', async (ctx) => {
    const u = await member(), it = await one('SELECT * FROM garage WHERE id = $1', [int(fd, 'id')]);
    if (!it) return '/members';
    ctx.back = `/members/${it.user_id}`;
    await canEdit(u, it.user_id);
    await q('DELETE FROM garage WHERE id = $1', [it.id]);
    await rmfile(it.file);
    await flash('Archivo eliminado.');
  });
}

/* =================== EVENTOS (cualquier administrador) =================== */

export async function eventAdd(fd) {
  await run('/events', async () => {
    const u = await admin();
    const t = txt(fd, 'title'), d = str(fd, 'date'), tm = txt(fd, 'time'), pl = txt(fd, 'place'), mu = txt(fd, 'maps_url'), ds = txt(fd, 'descr');
    if (!t || !pl) throw new UserError('Titulo y ubicacion son obligatorios.');
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    const dt = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!m || dt.getUTCMonth() !== +m[2] - 1 || dt.getUTCDate() !== +m[3]) throw new UserError('Fecha invalida.');
    if (tm && !/^([01]\d|2[0-3]):[0-5]\d$/.test(tm)) throw new UserError('Hora invalida.');
    if (mu) {                                                    // solo enlaces https de Google Maps
      let ok = false;
      try { const x = new URL(mu); ok = x.protocol === 'https:' && ['www.google.com', 'google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'].includes(x.hostname.toLowerCase()); } catch {}
      if (!ok) throw new UserError('El enlace debe ser de Google Maps (https).');
    }
    const flyer = fileField(fd, 'flyer', u.id, { required: false });
    await q('INSERT INTO events(title, "date", "time", place, maps_url, descr, flyer, user_id, created) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [cut(t, 120), d, tm, cut(pl, 200), mu, cut(ds, 2000), flyer, u.id, now()]);
    await flash('Evento creado.');
  });
}

export async function eventDel(fd) {
  await admin();
  const ev = await one('SELECT * FROM events WHERE id = $1', [int(fd, 'id')]);
  if (ev) { await q('DELETE FROM events WHERE id = $1', [ev.id]); await rmfile(ev.flyer); await flash('Evento eliminado.'); }
  redirect('/events');
}

/* =================== PANEL DE ADMINISTRACION =================== */

/* Solicitudes de ingreso: aceptar (envia correo) */
export async function approveUser(fd) {
  await admin();
  const x = await one('SELECT * FROM users WHERE id = $1 AND verified AND NOT approved AND NOT hidden AND name IS NOT NULL', [int(fd, 'id')]);
  if (x) {
    await q('UPDATE users SET approved = true WHERE id = $1', [x.id]);
    const sent = await approvedMail(x.email, x.nick);
    await flash(sent.ok ? 'Miembro aceptado. Se le envió un correo de bienvenida.' : `Miembro aceptado, pero el correo de bienvenida falló: ${sent.error}`, sent.ok ? 'ok' : 'err');
  }
  redirect('/admin');
}

/* Rechazar solicitud o eliminar miembro */
async function removeUser(fd, reject) {
  await run('/admin', async () => {
    const u = await admin(), id = int(fd, 'id');
    if (id === u.id) throw new UserError('No puedes eliminarte a ti mismo.');
    const x = await one('SELECT * FROM users WHERE id = $1 AND hidden = false', [id]);
    if (reject && x?.approved) throw new UserError('Ese miembro ya fue aceptado.');
    if (x?.role === 'admin' && !isSuper(u)) throw new UserError('Solo el super administrador puede eliminar administradores.');
    if (x) { await purgeUser(x); await flash(reject ? 'Solicitud rechazada.' : 'Miembro eliminado.'); }
  });
}
export async function rejectUser(fd) { await removeUser(fd, true); }
export async function delUser(fd) { await removeUser(fd, false); }

/* Roles: SOLO super admin */
export async function setRole(fd) {
  await run('/admin', async () => {
    const u = await superOnly(), id = int(fd, 'id'), role = str(fd, 'role') === 'admin' ? 'admin' : 'member';
    const board = !!fd.get('board'), title = cut(txt(fd, 'title'), 60);
    if (id === u.id && role !== 'admin') throw new UserError('No puedes quitarte tu propio rol.');
    if (board && !title) throw new UserError('Escribe el cargo para mostrarlo en Directiva (ej. Presidente, Tesorero).');
    await q(`UPDATE users SET role = $1, title = $2, "rank" = $3, board = $4 WHERE id = $5 AND hidden = false`, [role, title, int(fd, 'rank'), board, id]);
    if (role === 'admin' || board) await q('UPDATE users SET approved = true WHERE id = $1 AND hidden = false', [id]);
    await flash('Rol actualizado.');
  });
}

/* Acciones en lote */
export async function bulk(fd) {
  await run('/admin', async () => {
    const u = await admin();
    const ids = [...new Set(fd.getAll('ids').map((v) => parseInt(v, 10)).filter((n) => n > 0))];
    const scope = str(fd, 'scope'), op = str(fd, 'op');
    if (!ids.length) throw new UserError('Selecciona al menos un elemento.');
    let n = 0, failed = 0;
    for (const id of ids) {
      if (scope === 'users' || scope === 'pending') {
        const x = await one('SELECT * FROM users WHERE id = $1 AND hidden = false', [id]);
        if (!x || x.id === u.id) continue;
        if (op === 'approve') { if (!x.approved && x.name) { await q('UPDATE users SET approved = true WHERE id = $1', [id]); if (!(await approvedMail(x.email, x.nick)).ok) failed++; n++; } }
        else if (op === 'reject') { if (!x.approved) { await purgeUser(x); n++; } }
        else if (op === 'delete') { if (x.role === 'admin' && !isSuper(u)) continue; await purgeUser(x); n++; }
      } else if (scope === 'products') {
        const r = await one('SELECT * FROM products WHERE id = $1', [id]);
        if (r) { await q('DELETE FROM products WHERE id = $1', [id]); await rmfile(r.photo); n++; }
      } else if (scope === 'media' && isSuper(u)) {
        const r = await one('SELECT * FROM media WHERE id = $1', [id]);
        if (r) { await q('DELETE FROM media WHERE id = $1', [id]); await rmfile(r.file); n++; }
      }
    }
    await flash(`${n} elemento(s) procesado(s).` + (failed ? ` ${failed} correo(s) de bienvenida no se pudieron enviar (revisa la sección Correo).` : ''), failed ? 'err' : 'ok');
  });
}

/* Textos, redes, colores, fondo e imagenes del sitio: SOLO super admin */
export async function saveSettings(fd) {
  await run('/admin', async () => {
    const u = await superOnly(), cur = await getSettings();
    for (const [k, [name, hosts]] of Object.entries(SOCIAL)) {     // solo enlaces https de la red correcta
      const v = txt(fd, 'soc_' + k);
      if (!v) continue;
      let ok = false;
      try { const x = new URL(v); ok = x.protocol === 'https:' && hosts.includes(x.hostname.toLowerCase()); } catch {}
      if (!ok) throw new UserError(`Enlace de ${name} invalido (debe empezar con https:// y ser de ${name}).`);
    }
    const bg = fileField(fd, 'bg_img', u.id, { required: false });
    const heroes = ['hero1', 'hero2', 'hero3', 'hero4'].map((k) => [k, fileField(fd, k, u.id, { required: false })]);

    for (const k of Object.keys(SOCIAL)) await setcfg('soc_' + k, txt(fd, 'soc_' + k));
    for (const k of ['club_name', 'about_text', 'hero_eyebrow', 'hero_title']) await setcfg(k, cut(str(fd, k), 3000));
    for (const k of ['c_accent', 'c_bg', 'c_card', 'c_text']) if (/^#[0-9a-f]{6}$/i.test(str(fd, k))) await setcfg(k, str(fd, k));
    if (FONTS.includes(str(fd, 'font'))) await setcfg('font', str(fd, 'font'));
    await setcfg('bg_dim', String(Math.max(0, Math.min(90, int(fd, 'bg_dim')))));
    if (fd.get('bg_remove') || bg) { await rmfile(cur.bg_img); await setcfg('bg_img', bg || ''); }
    await setcfg('hero_blend', fd.get('hero_blend') ? '1' : '0');
    for (const [k, file] of heroes) {
      if (file || fd.get('hero_clear')) { await rmfile(cur[k]); await setcfg(k, file || ''); }
    }
    await flash('Cambios guardados.');
  });
}

/* Prueba de correo: SOLO super admin. Muestra el error exacto si falla. */
export async function testMail(fd) {
  await run('/admin', async () => {
    await superOnly();
    const to = txt(fd, 'to').toLowerCase();
    if (!emailOk(to)) throw new UserError('Escribe un correo válido para la prueba.');
    const r = await sendMail(to, 'Prueba GLC', 'Si lees esto, el envío de correos del sitio funciona.');
    if (!r.ok) throw new UserError('El correo NO se envió: ' + r.error);
    await flash(`Correo de prueba enviado a ${to}. Revisa la bandeja de entrada y la carpeta de spam.`);
  });
}
