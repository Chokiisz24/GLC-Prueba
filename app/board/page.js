/* Directiva: miembros marcados como directiva por el super admin, en el orden indicado.
 * Es solo informativo: su perfil sigue en Miembros (cada tarjeta lleva a su pagina). */
import Link from 'next/link';
import { q } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import Page, { Morph } from '@/components/Page';
import { StaggerGrid } from '@/components/Stagger';
import { Img } from '@/components/Bits';

export const metadata = { title: 'Directiva' };

export default async function BoardPage() {
  await pageUser();
  const list = await q(`SELECT * FROM users WHERE board AND approved AND verified AND NOT hidden AND name IS NOT NULL ORDER BY "rank", id`);
  return (
    <Page>
      <h1>Directiva</h1>
      {!list.length && <p className="mut">La directiva del club se mostrará aquí. El super administrador la asigna en ⚙ Admin → Miembros y roles.</p>}
      <StaggerGrid className="board">
        {list.map((m) => (
          <Link className="card" key={m.id} href={`/members/${m.id}`} transitionTypes={['nav-forward']}>
            <Morph name={`av-${m.id}`}><Img src={m.photo} className="portrait" /></Morph>
            <b className="role">{m.title}</b>
            <h3>{m.name}</h3>
            <small>{m.nick} · {m.city}</small>
          </Link>
        ))}
      </StaggerGrid>
    </Page>
  );
}
