/* Multimedia: muro tipo mosaico con filtro Todo · Fotos · Videos */
import { q, one } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import { MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';
import { mediaUpload } from '../actions';
import UploadForm from '@/components/UploadForm';
import Pager, { curPage } from '@/components/Pager';
import { NeedMsg } from '@/components/Bits';
import Page from '@/components/Page';
import Seg from '@/components/Seg';
import MediaWall from '@/components/MediaWall';

export const metadata = { title: 'Multimedia' };
const PER = 20;
const FILTERS = { all: null, image: 'image', video: 'video' };

export default async function MediaPage({ searchParams }) {
  const u = await pageUser(), ok = u?.approved;
  const sp = await searchParams;
  const f = sp?.f in FILTERS ? sp.f : 'all';
  const page = curPage(sp);
  const type = FILTERS[f];
  const where = type ? `WHERE m."type" = $2` : '';
  const [list, counts] = await Promise.all([
    q(`SELECT m.*, u.nick, u.photo, (SELECT COUNT(*) FROM comments c WHERE c.media_id = m.id) AS nc
       FROM media m JOIN users u ON u.id = m.user_id ${where} ORDER BY m.id DESC LIMIT ${PER} OFFSET $1`,
      type ? [(page - 1) * PER, type] : [(page - 1) * PER]),
    one(`SELECT COUNT(*) AS t, COUNT(*) FILTER (WHERE "type" = 'image') AS i, COUNT(*) FILTER (WHERE "type" = 'video') AS v FROM media`),
  ]);
  const total = type === 'image' ? counts.i : type === 'video' ? counts.v : counts.t;
  const base = f === 'all' ? '/media' : `/media?f=${f}`;
  const items = list.map(({ id, type: t, file, descr, nick, photo, nc }) => ({ id, type: t, file, descr, nick, photo, nc }));

  return (
    <Page>
      <div className="wall-head">
        <div>
          <h1>Multimedia</h1>
          <p className="mut">{counts.i} {counts.i === 1 ? 'foto' : 'fotos'} · {counts.v} {counts.v === 1 ? 'video' : 'videos'} del club</p>
        </div>
        <Seg label="Filtrar" active={f} items={[
          ['all', 'Todo', '/media', counts.t], ['image', 'Fotos', '/media?f=image', counts.i], ['video', 'Videos', '/media?f=video', counts.v],
        ]} />
      </div>

      {!ok ? <NeedMsg u={u} what="subir fotos o videos" /> : (
        <details className="upl">
          <summary className="btn">+ Subir foto o video</summary>
          <UploadForm action={mediaUpload} uid={u.id} kind="media" className="f card" style={{ marginTop: '1rem' }}>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required />
            <small>Fotos hasta {MAX_IMG_MB} MB · videos MP4/WebM hasta {MAX_VIDEO_MB} MB</small>
            <textarea name="descr" placeholder="Descripción" maxLength={500} required />
            <button>Subir</button>
          </UploadForm>
        </details>
      )}

      {items.length
        ? <MediaWall key={f + page} items={items} />
        : <div className="wall-empty">{f === 'video' ? 'Todavía no hay videos.' : f === 'image' ? 'Todavía no hay fotos.' : 'Todavía no hay fotos ni videos. ¡Sé el primero en subir uno!'}</div>}
      <Pager total={total} per={PER} page={page} base={base} />
    </Page>
  );
}
