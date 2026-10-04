/* Panel de administracion. Todo se valida otra vez en el servidor (app/actions.js). */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, one } from '@/lib/db';
import { pageUser, isAdmin, isSuper } from '@/lib/auth';
import { getSettings, SOCIAL, FONTS } from '@/lib/config';
import { approveUser, rejectUser, delUser, setRole, bulk, saveSettings, totpReset } from '../actions';
import UploadForm from '@/components/UploadForm';
import Pager, { curPage } from '@/components/Pager';
import { Img, Hidden, Confirm } from '@/components/Bits';

export const metadata = { title: 'Administración' };
const PER = 20;
const fontName = (f) => (f === FONTS[0] ? 'Sistema (estilo Apple / Google)' : f.split(',')[0].replace(/"/g, '').trim());
const short = (s, n) => [...(s || '')].slice(0, n).join('');

function BulkForm({ id, scope, children }) {
  return (
    <form id={id} action={bulk} className="row">
      <Hidden name="scope" value={scope} />
      {children}
    </form>
  );
}

export default async function AdminPage({ searchParams }) {
  const u = await pageUser();
  if (!isAdmin(u) || !u.approved) redirect('/');
  const sup = isSuper(u), page = curPage(await searchParams);
  const [pend, users, total, prods, med, s] = await Promise.all([
    q('SELECT * FROM users WHERE verified AND NOT approved AND NOT hidden ORDER BY created'),
    q(`SELECT * FROM users WHERE NOT hidden ORDER BY created, id LIMIT ${PER} OFFSET $1`, [(page - 1) * PER]),
    one('SELECT COUNT(*) AS c FROM users WHERE NOT hidden'),
    q('SELECT p.*, u.nick AS name FROM products p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT 50'),
    sup ? q('SELECT m.*, u.nick AS name FROM media m JOIN users u ON u.id = m.user_id ORDER BY m.id DESC LIMIT 50') : [],
    getSettings(),
  ]);
  const canTouch = (m) => m.id !== u.id && (m.role !== 'admin' || sup);

  return (
    <>
      <h1>Configuración de administrador</h1>
      <p><Link className="btn s" href="/security">🔐 Seguridad: verificación en 2 pasos</Link></p>

      {/* ---------- Solicitudes de ingreso ---------- */}
      <h2>Solicitudes de ingreso{pend.length ? ` (${pend.length})` : ''}</h2>
      {!pend.length && <p className="mut">No hay solicitudes pendientes.</p>}
      <div className="grid">
        {pend.map((x) => (
          <div className="card" key={x.id}>
            <label className="inl"><input type="checkbox" name="ids" value={x.id} form="bulkp" /> Seleccionar</label>
            <Img src={x.car_photo} />
            <div className="who">
              <Img src={x.photo} className="av" />
              <div><h3>{x.nick || '(sin apodo)'}</h3><small>{x.name || 'Aún no completa su perfil'}<br />{x.email}</small></div>
            </div>
            {x.name ? (
              <>
                <p><small>{x.city}, {x.country} · {x.age} años<br />Lancer {x.version} {x.year} · {x.color}<br />Mods: {x.mods}</small></p>
                <form action={approveUser} style={{ marginBottom: '.5rem' }}><Hidden name="id" value={x.id} /><button>Aceptar y notificar</button></form>
              </>
            ) : <p><small>Esperando que complete su perfil.</small></p>}
            <form action={rejectUser} className="row" style={{ marginTop: 0 }}>
              <Hidden name="id" value={x.id} /><Confirm /><button className="danger">Rechazar</button>
            </form>
          </div>
        ))}
      </div>
      {pend.length > 0 && (
        <BulkForm id="bulkp" scope="pending">
          <select name="op" className="auto">
            <option value="approve">Aceptar y notificar a los seleccionados</option>
            <option value="reject">Rechazar a los seleccionados</option>
          </select>
          <Confirm /><button>Aplicar</button>
        </BulkForm>
      )}

      {/* ---------- Sitio (solo super admin) ---------- */}
      {sup && (
        <>
          <h2>Sitio, textos y diseño</h2>
          <UploadForm action={saveSettings} uid={u.id} kind="site" className="f card" style={{ maxWidth: 700 }}>
            <label>Nombre del club<input name="club_name" defaultValue={s.club_name} /></label>
            <label>Portada: frase pequeña (arriba del título)<input name="hero_eyebrow" defaultValue={s.hero_eyebrow} /></label>
            <label>Portada: título grande (Enter = salto de línea)<textarea name="hero_title" rows={2} defaultValue={s.hero_title} /></label>
            <label>Portada: descripción del club<textarea name="about_text" rows={5} defaultValue={s.about_text} /></label>
            {Object.entries(SOCIAL).map(([k, [name]]) => (
              <label key={k}>{name} (enlace completo, vacío = no mostrar)<input type="url" name={'soc_' + k} defaultValue={s['soc_' + k] || ''} placeholder="https://" /></label>
            ))}
            <label>Color principal <input type="color" name="c_accent" defaultValue={s.c_accent} /></label>
            <label>Color de fondo <input type="color" name="c_bg" defaultValue={s.c_bg || '#f5f5f7'} /></label>
            <label>Color de tarjetas <input type="color" name="c_card" defaultValue={s.c_card || '#ffffff'} /></label>
            <label>Color de letras <input type="color" name="c_text" defaultValue={s.c_text || '#1d1d1f'} /></label>
            <label>Imagen de fondo (opcional)<input type="file" name="bg_img" accept="image/jpeg,image/png,image/webp" /></label>
            {s.bg_img && <label className="inl"><input type="checkbox" name="bg_remove" value="1" /> Quitar imagen de fondo actual</label>}
            <label>Oscurecer imagen de fondo (%, mejora la lectura)<input type="number" name="bg_dim" min={0} max={90} defaultValue={s.bg_dim} style={{ width: 90 }} /></label>
            <label>Tipografía
              <select name="font" defaultValue={s.font}>{FONTS.map((f) => <option key={f} value={f}>{fontName(f)}</option>)}</select>
            </label>
            {['hero1', 'hero2', 'hero3'].map((k, i) => (
              <label key={k}>Imagen de presentación {i + 1} (opcional, reemplaza)<input type="file" name={k} accept="image/jpeg,image/png,image/webp" /></label>
            ))}
            <label className="inl"><input type="checkbox" name="hero_blend" value="1" defaultChecked={s.hero_blend === '1'} /> Fusionar el fondo negro de las imágenes de presentación (ideal para logos)</label>
            <label className="inl"><input type="checkbox" name="hero_clear" value="1" /> Quitar las 3 imágenes de presentación actuales</label>
            <button>Guardar cambios</button>
          </UploadForm>
        </>
      )}

      {/* ---------- Miembros ---------- */}
      <h2>{sup ? 'Miembros y roles' : 'Miembros'}</h2>
      <div className="card tbl">
        <table>
          <thead><tr><th>Miembro</th><th>Rol / cargo / orden (0 = líder)</th><th></th></tr></thead>
          <tbody>
            {users.map((m) => (
              <tr key={m.id}>
                <td>
                  {canTouch(m) && <><input type="checkbox" name="ids" value={m.id} form="bulku" />{' '}</>}
                  {m.name || '(sin perfil)'}<br /><small>{m.email}{!m.verified && ' · sin verificar'}{m.verified && !m.approved && ' · pendiente'}</small>
                </td>
                <td>
                  {sup ? (
                    <form action={setRole}>
                      <Hidden name="id" value={m.id} />
                      <select name="role" className="auto" defaultValue={m.role}><option value="member">Miembro</option><option value="admin">Administrador</option></select>
                      <input name="title" placeholder="Cargo" defaultValue={m.title} maxLength={60} style={{ width: 130 }} />
                      <input type="number" name="rank" defaultValue={m.rank} style={{ width: 70 }} aria-label="Orden" />
                      <button>OK</button>
                    </form>
                  ) : (m.role === 'admin' ? 'Administrador' : 'Miembro') + (m.title ? ` · ${m.title}` : '')}
                </td>
                <td>
                  {canTouch(m) && (
                    <form action={delUser}><Confirm /><Hidden name="id" value={m.id} /><button className="danger">Eliminar</button></form>
                  )}
                  {sup && m.totp && (
                    <form action={totpReset} style={{ marginTop: '.3rem' }}><Hidden name="id" value={m.id} /><button className="s">Quitar 2FA</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BulkForm id="bulku" scope="users">
        <Hidden name="op" value="delete" /><Confirm /><button className="danger">Eliminar miembros seleccionados</button>
      </BulkForm>
      <Pager total={total.c} per={PER} page={page} base="/admin" />

      {/* ---------- Productos ---------- */}
      <h2>Productos en venta</h2>
      {!prods.length ? <p className="mut">No hay productos publicados.</p> : (
        <>
          <div className="card tbl">
            <table>
              <thead><tr><th></th><th>Producto</th><th>Vendedor</th><th>Precio</th></tr></thead>
              <tbody>
                {prods.map((r) => (
                  <tr key={r.id}><td><input type="checkbox" name="ids" value={r.id} form="bulkpr" /></td><td>{r.title}</td><td>{r.name}</td><td>{r.price}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <BulkForm id="bulkpr" scope="products"><Confirm /><button className="danger">Eliminar productos seleccionados</button></BulkForm>
        </>
      )}

      {/* ---------- Multimedia (solo super admin) ---------- */}
      {sup && (
        <>
          <h2>Fotos y videos del club</h2>
          {!med.length ? <p className="mut">No hay multimedia.</p> : (
            <>
              <div className="card tbl">
                <table>
                  <thead><tr><th></th><th>Tipo</th><th>Descripción</th><th>Subido por</th></tr></thead>
                  <tbody>
                    {med.map((r) => (
                      <tr key={r.id}><td><input type="checkbox" name="ids" value={r.id} form="bulkme" /></td><td>{r.type === 'video' ? 'Video' : 'Foto'}</td><td>{short(r.descr, 70)}</td><td>{r.name}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <BulkForm id="bulkme" scope="media"><Confirm /><button className="danger">Eliminar seleccionados</button></BulkForm>
            </>
          )}
        </>
      )}
    </>
  );
}
