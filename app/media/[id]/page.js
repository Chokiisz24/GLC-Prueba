/* Detalle de foto/video con comentarios */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, one } from '@/lib/db';
import { pageUser, isAdmin, isSuper } from '@/lib/auth';
import { fdatetime } from '@/lib/config';
import { delMedia, addComment, delComment } from '../../actions';
import { Hidden, Lines, NeedMsg } from '@/components/Bits';

export default async function MediaItem({ params }) {
  const u = await pageUser(), ok = u?.approved;
  const id = parseInt((await params).id, 10) || 0;
  const m = await one('SELECT m.*, u.nick AS name FROM media m JOIN users u ON u.id = m.user_id WHERE m.id = $1', [id]);
  if (!m) redirect('/media');
  const comments = await q('SELECT c.*, u.nick AS name FROM comments c JOIN users u ON u.id = c.user_id WHERE media_id = $1 ORDER BY c.id', [id]);
  return (
    <>
      <Link href="/media">← Volver</Link>
      <div className="card" style={{ marginTop: '1rem' }}>
        {m.type === 'video'
          ? <video className="big" controls src={m.file} />
          // eslint-disable-next-line @next/next/no-img-element
          : <a href={m.file} data-lb="m" data-cap={m.descr}><img className="big" src={m.file} alt="" /></a>}
        <p><Lines text={m.descr} /> <small>— {m.name}</small></p>
        {ok && (u.id === m.user_id || isSuper(u)) && (
          <form action={delMedia}><Hidden name="id" value={id} /><button className="danger">Eliminar</button></form>
        )}
      </div>
      <h2>Comentarios</h2>
      {comments.map((c) => (
        <div className="card" key={c.id} style={{ margin: '.4rem 0' }}>
          <b>{c.name}</b> <small>{fdatetime(c.created)}</small><br />
          <Lines text={c.body} />
          {ok && (u.id === c.user_id || u.id === m.user_id || isAdmin(u)) && (
            <form action={delComment} style={{ marginTop: '.4rem' }}><Hidden name="id" value={c.id} /><button className="danger">Eliminar</button></form>
          )}
        </div>
      ))}
      {!ok ? <NeedMsg u={u} what="comentar" /> : (
        <form className="f" action={addComment} style={{ marginTop: '1rem' }}>
          <Hidden name="mid" value={id} />
          <textarea name="body" maxLength={500} placeholder="Escribe un comentario" required />
          <button>Comentar</button>
        </form>
      )}
    </>
  );
}
