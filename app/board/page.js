import { q } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import { Img } from '@/components/Bits';

export const metadata = { title: 'Directiva' };

export default async function BoardPage() {
  await pageUser();
  const list = await q(`SELECT * FROM users WHERE role = 'admin' AND NOT hidden AND name IS NOT NULL ORDER BY "rank", id`);
  return (
    <>
      <h1>Directiva</h1>
      <div className="grid">
        {list.map((m) => (
          <div className="card" key={m.id}>
            <Img src={m.photo} />
            <h3>{m.name}</h3>
            <b style={{ color: 'var(--a)' }}>{m.title || 'Directivo'}</b><br />
            <small>{m.city}</small>
          </div>
        ))}
      </div>
    </>
  );
}
