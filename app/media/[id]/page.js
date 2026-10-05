/* Visor de foto/video: escenario oscuro con la imagen + panel con autor, descripcion y comentarios */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, one } from '@/lib/db';
import { pageUser, isAdmin, isSuper } from '@/lib/auth';
import { fdatetime } from '@/lib/config';
import { blobOk } from '@/lib/blob';
import { delMedia, addComment, delComment } from '../../actions';
import { Hidden, Lines, NeedMsg } from '@/components/Bits';
import Page, { Morph } from '@/components/Page';
import { BackLink } from '@/components/Stagger';

function Avatar({ src, name, size = 36 }) {
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className="ava" src={src} alt="" style={{ width: size, height: size }} />
    : <span className="ava" style={{ width: size, height: size }}>{(name || '?')[0]}</span>;
}

export default async function MediaItem({ params }) {
  const u = await pageUser(), ok = u?.approved;
  const id = parseInt((await params).id, 10) || 0;
  const m = await one('SELECT m.*, u.nick, u.photo FROM media m JOIN users u ON u.id = m.user_id WHERE m.id = $1', [id]);
  if (!m) redirect('/media');
  const [comments, newer, older] = await Promise.all([
    q('SELECT c.*, u.nick, u.photo FROM comments c JOIN users u ON u.id = c.user_id WHERE media_id = $1 ORDER BY c.id', [id]),
    one('SELECT id FROM media WHERE id > $1 ORDER BY id ASC LIMIT 1', [id]),
    one('SELECT id FROM media WHERE id < $1 ORDER BY id DESC LIMIT 1', [id]),
  ]);
  const bg = blobOk(m.file) && m.type === 'image' ? { '--bg': `url("${m.file}")` } : undefined;

  return (
    <Page>
      <div className="viewer-top">
        <BackLink href="/media">← Multimedia</BackLink>
        <div className="viewer-nav">
          {newer ? <Link href={`/media/${newer.id}`} transitionTypes={['nav-back']} aria-label="Anterior" className="vn">‹</Link> : <span className="vn off">‹</span>}
          {older ? <Link href={`/media/${older.id}`} transitionTypes={['nav-forward']} aria-label="Siguiente" className="vn">›</Link> : <span className="vn off">›</span>}
        </div>
      </div>

      <div className="viewer">
        <div className="stage" style={bg}>
          {m.type === 'video'
            ? <Morph name={`media-${m.id}`}><video controls playsInline src={m.file} /></Morph>
            // eslint-disable-next-line @next/next/no-img-element
            : <a href={m.file} data-lb="m" data-cap={m.descr}><Morph name={`media-${m.id}`}><img src={m.file} alt={m.descr || ''} /></Morph></a>}
        </div>

        <aside className="side">
          <div className="side-head">
            <Avatar src={m.photo} name={m.nick} size={42} />
            <div><b>{m.nick}</b><small>{fdatetime(m.created)}</small></div>
            {ok && (u.id === m.user_id || isSuper(u)) && (
              <form action={delMedia} className="side-del"><Hidden name="id" value={id} /><button className="danger">Eliminar</button></form>
            )}
          </div>
          {m.descr && <p className="side-descr"><Lines text={m.descr} /></p>}

          <div className="thread">
            <div className="thread-t">{comments.length ? `${comments.length} ${comments.length === 1 ? 'comentario' : 'comentarios'}` : 'Sin comentarios todavía'}</div>
            {comments.map((c, i) => (
              <div className="cm" key={c.id} style={{ '--i': Math.min(i, 10) }}>
                <Avatar src={c.photo} name={c.nick} size={32} />
                <div className="cm-b">
                  <div><b>{c.nick}</b> <small>{fdatetime(c.created)}</small></div>
                  <Lines text={c.body} />
                  {ok && (u.id === c.user_id || u.id === m.user_id || isAdmin(u)) && (
                    <form action={delComment}><Hidden name="id" value={c.id} /><button className="cm-x">Eliminar</button></form>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!ok ? <div className="side-need"><NeedMsg u={u} what="comentar" /></div> : (
            <form className="composer" action={addComment}>
              <Hidden name="mid" value={id} />
              <textarea name="body" maxLength={500} rows={1} placeholder="Escribe un comentario…" required />
              <button aria-label="Comentar">Comentar</button>
            </form>
          )}
        </aside>
      </div>
    </Page>
  );
}
