/* Pagina personal de un miembro (publica; la edita solo el dueno o un administrador) */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, one } from '@/lib/db';
import { pageUser, isAdmin } from '@/lib/auth';
import { MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';
import { bioSave, garageUp, garageDel } from '../../actions';
import UploadForm from '@/components/UploadForm';
import { Img, Hidden, Lines } from '@/components/Bits';
import Page, { Morph } from '@/components/Page';
import { StaggerGrid, BackLink } from '@/components/Stagger';

export default async function MemberPage({ params }) {
  const u = await pageUser();
  const mid = parseInt((await params).id, 10) || 0;
  const m = await one('SELECT * FROM users WHERE id = $1 AND verified AND approved AND NOT hidden AND name IS NOT NULL', [mid]);
  if (!m) redirect('/members');
  const own = u && u.id === m.id;
  const can = u?.approved && (own || isAdmin(u));
  const items = await q('SELECT * FROM garage WHERE user_id = $1 ORDER BY id DESC', [mid]);

  return (
    <Page>
      <BackLink href="/members">← Miembros</BackLink>
      <div className="card" style={{ marginTop: '1rem' }}>
        <Morph name={`car-${m.id}`}><Img src={m.car_photo} className="mcover" /></Morph>
        <div className="who rise" style={{ '--i': 0 }}>
          <Morph name={`av-${m.id}`}><Img src={m.photo} className="av" /></Morph>
          <div><h1 style={{ margin: 0, fontSize: '2rem' }}>{m.nick}</h1><small>{m.city}, {m.country}</small></div>
        </div>
        <p className="rise" style={{ '--i': 1 }}>
          {m.board && <span className="chip board">Directiva · {m.title}</span>}
          <span className="chip">Lancer {m.version} {m.year}</span><span className="chip">{m.color}</span><span className="chip">{m.age} años</span>
        </p>
        <p className="rise" style={{ '--i': 2 }}><b>Modificaciones:</b> {m.mods}</p>
        {m.bio && <p className="rise" style={{ '--i': 3 }}><Lines text={m.bio} /></p>}
        {can && own && <Link className="btn s" href="/profile">Editar datos de mi perfil</Link>}
      </div>

      {can && (
        <details style={{ marginTop: '1rem' }}>
          <summary className="btn">{own ? 'Personalizar mi página' : 'Administrar esta página (admin)'}</summary>
          <form className="f card" action={bioSave} style={{ marginTop: '1rem' }}>
            <Hidden name="uid" value={mid} />
            <label>Sobre el miembro y su Lancer<textarea name="bio" rows={4} maxLength={1000} defaultValue={m.bio || ''} /></label>
            <button>Guardar descripción</button>
          </form>
          <UploadForm action={garageUp} uid={u.id} kind="media" className="f card" style={{ marginTop: '1rem' }}>
            <Hidden name="uid" value={mid} />
            <label>Foto o video<input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required /></label>
            <small>Fotos hasta {MAX_IMG_MB} MB · videos hasta {MAX_VIDEO_MB} MB</small>
            <input name="caption" maxLength={200} placeholder="Descripción (opcional)" />
            <button>Subir</button>
          </UploadForm>
        </details>
      )}

      {[['image', 'Fotos'], ['video', 'Videos']].map(([t, label]) => {
        const list = items.filter((i) => i.type === t);
        if (!list.length) return null;
        return (
          <section key={t}>
            <h2>{label}</h2>
            <StaggerGrid>
              {list.map((i) => (
                <div className="card" key={i.id}>
                  {t === 'image'
                    ? <a href={i.file} data-lb="g" data-cap={i.caption || ''}><Img src={i.file} /></a>
                    : <video controls preload="metadata" src={i.file} />}
                  {i.caption && <small>{i.caption}</small>}
                  {can && <form action={garageDel} style={{ marginTop: '.5rem' }}><Hidden name="id" value={i.id} /><button className="danger">Eliminar</button></form>}
                </div>
              ))}
            </StaggerGrid>
          </section>
        );
      })}
      {!items.length && <p className="mut" style={{ marginTop: '1rem' }}>Este miembro aún no ha subido fotos ni videos.</p>}
    </Page>
  );
}
