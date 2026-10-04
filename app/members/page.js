import Link from 'next/link';
import { q, one } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import Pager, { curPage } from '@/components/Pager';
import { Img } from '@/components/Bits';
import Page, { Morph } from '@/components/Page';
import { StaggerGrid } from '@/components/Stagger';

export const metadata = { title: 'Miembros' };
const PER = 12;
const WHERE = 'verified AND approved AND NOT hidden AND name IS NOT NULL';

export default async function MembersPage({ searchParams }) {
  await pageUser();
  const page = curPage(await searchParams);
  const [list, total] = await Promise.all([
    q(`SELECT * FROM users WHERE ${WHERE} ORDER BY created, id LIMIT ${PER} OFFSET $1`, [(page - 1) * PER]),
    one(`SELECT COUNT(*) AS c FROM users WHERE ${WHERE}`),
  ]);
  return (
    <Page>
      <h1>Miembros oficiales</h1>
      <StaggerGrid>
        {list.map((m) => (
          <Link className="card" key={m.id} href={`/members/${m.id}`} transitionTypes={['nav-forward']}>
            <Morph name={`car-${m.id}`}><Img src={m.car_photo} /></Morph>
            <div className="who">
              <Morph name={`av-${m.id}`}><Img src={m.photo} className="av" /></Morph>
              <div><h3>{m.nick}</h3>{m.board && <span className="badge">{m.title}</span>}<small>{m.city}, {m.country} · {m.age} años</small></div>
            </div>
            <p>Lancer {m.version} {m.year} · {m.color}<br /><small>Mods: {m.mods}</small></p>
          </Link>
        ))}
      </StaggerGrid>
      {!list.length && <p className="mut">Todavía no hay miembros aceptados.</p>}
      <Pager total={total.c} per={PER} page={page} base="/members" />
    </Page>
  );
}
