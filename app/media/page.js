/* Multimedia: galeria de fotos y videos del club */
import Link from 'next/link';
import { q, one } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import { MAX_IMG_MB, MAX_VIDEO_MB } from '@/lib/limits';
import { mediaUpload } from '../actions';
import UploadForm from '@/components/UploadForm';
import Pager, { curPage } from '@/components/Pager';
import { Img, NeedMsg } from '@/components/Bits';

export const metadata = { title: 'Multimedia' };
const PER = 12;

export default async function MediaPage({ searchParams }) {
  const u = await pageUser(), ok = u?.approved;
  const page = curPage(await searchParams);
  const [imgs, vids, counts] = await Promise.all([
    q(`SELECT * FROM media WHERE "type" = 'image' ORDER BY id DESC LIMIT ${PER} OFFSET $1`, [(page - 1) * PER]),
    q(`SELECT * FROM media WHERE "type" = 'video' ORDER BY id DESC LIMIT ${PER} OFFSET $1`, [(page - 1) * PER]),
    one(`SELECT COUNT(*) FILTER (WHERE "type" = 'image') AS i, COUNT(*) FILTER (WHERE "type" = 'video') AS v FROM media`),
  ]);
  const short = (s) => [...(s || '')].slice(0, 60).join('');
  return (
    <>
      <h1>Multimedia</h1>
      {!ok ? <NeedMsg u={u} what="subir fotos o videos" /> : (
        <details>
          <summary className="btn">+ Subir foto o video</summary>
          <UploadForm action={mediaUpload} uid={u.id} kind="media" className="f" style={{ marginTop: '1rem' }}>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required />
            <small>Fotos hasta {MAX_IMG_MB} MB · videos MP4/WebM hasta {MAX_VIDEO_MB} MB</small>
            <textarea name="descr" placeholder="Descripción" maxLength={500} required />
            <button>Subir</button>
          </UploadForm>
        </details>
      )}
      <h2>Imágenes</h2>
      <div className="grid">
        {imgs.map((m) => <Link className="card" key={m.id} href={`/media/${m.id}`}><Img src={m.file} /><small>{short(m.descr)}</small></Link>)}
      </div>
      <h2>Videos</h2>
      <div className="grid">
        {vids.map((m) => <Link className="card" key={m.id} href={`/media/${m.id}`}><video muted preload="metadata" src={`${m.file}#t=0.5`} /><small>{short(m.descr)}</small></Link>)}
      </div>
      <Pager total={Math.max(counts.i, counts.v)} per={PER} page={page} base="/media" />
    </>
  );
}
