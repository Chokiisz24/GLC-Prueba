/* Inicio: acerca del club */
import Link from 'next/link';
import { getSettings } from '@/lib/config';
import { pageUser } from '@/lib/auth';
import { Img, Lines } from '@/components/Bits';

export default async function Home() {
  const [u, s] = [await pageUser(), await getSettings()];
  const heroes = ['hero1', 'hero2', 'hero3'].map((k) => s[k]).filter(Boolean);
  return (
    <>
      <section className="hero-full">
        <div className="hero-in">
          <div className="eyebrow"><span>—</span> {s.hero_eyebrow}</div>
          <h1><Lines text={s.hero_title} /></h1>
          <p><Lines text={s.about_text} /></p>
          <div className="btns">
            {u ? <Link className="btn" href="/members">Ver miembros</Link> : <Link className="btn" href="/login">Únete al club</Link>}
            <Link className="btn o" href="/events">Próximos eventos</Link>
          </div>
        </div>
      </section>
      {heroes.length > 0 && <div className={'hero' + (s.hero_blend === '1' ? ' blend' : '')}>{heroes.map((h) => <Img key={h} src={h} />)}</div>}
    </>
  );
}
