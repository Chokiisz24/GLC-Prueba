/* Inicio (versión 2): portada con auto, accesos rápidos, próximo evento, galería destacada, únete/redes y tira de Lancers. */
import Link from 'next/link';
import { getSettings, SOCIAL } from '@/lib/config';
import { q } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import { blobOk } from '@/lib/blob';
import { Img } from '@/components/Bits';
import Page from '@/components/Page';
import HeroSlides from '@/components/HeroSlides';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const ICO = {   // iconos de linea (estilo Feather) para los accesos rapidos
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};
const TILES = [
  ['/members', 'users', 'Miembros', 'Conoce a la comunidad'], ['/events', 'cal', 'Eventos', 'Reuniones, rodadas y más'],
  ['/media', 'img', 'Galería', 'Fotos y videos del club'], ['/sales', 'cart', 'Ventas', 'Refacciones y accesorios'],
  ['/board', 'shield', 'Directiva', 'Quiénes llevan el club'],
];
const Ico = ({ n }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICO[n] }} />;

export default async function Home() {
  const [u, s] = [await pageUser(), await getSettings()];
  const today = new Date().toISOString().slice(0, 10);
  const [[ev], gal, cars] = await Promise.all([
    q('SELECT * FROM events WHERE "date" >= $1 ORDER BY "date", "time" LIMIT 1', [today]),
    q(`SELECT id, file, descr FROM media WHERE "type" = 'image' ORDER BY id DESC LIMIT 4`),
    q(`SELECT id, nick, version, car_photo FROM users WHERE verified AND approved AND NOT hidden AND name IS NOT NULL AND car_photo IS NOT NULL ORDER BY created DESC LIMIT 12`),
  ]);
  const slides = ['hero1', 'hero2', 'hero3', 'hero4'].map((k) => s[k]).filter((v) => v && blobOk(v));   // imagenes del carrusel (admin)
  const club = Object.entries(SOCIAL).filter(([k]) => s['soc_' + k]);
  const [l1, ...rest] = String(s.hero_title ?? '').split('\n');
  const flyer = ev && ev.flyer && blobOk(ev.flyer) ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.88)),url("${ev.flyer}")` } : undefined;

  return (
    <Page>
      <div className="home2">
        <section className="hero2">
          <HeroSlides slides={slides.length ? slides : ['/bienvenida.jpg']} />
          {club.length > 0 && (
            <div className="rail">
              {club.map(([k, [name, , svg]]) => <a key={k} href={s['soc_' + k]} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} dangerouslySetInnerHTML={{ __html: svg }} />)}
            </div>
          )}
          <div className="hero2-in">
            <div className="eyebrow"><span>—</span> {s.hero_eyebrow}</div>
            <h1>{l1}{rest.length > 0 && <><br /><em>{rest.join(' ')}</em></>}</h1>
            <p>{s.about_text}</p>
            <div className="btns">
              {u ? <Link className="btn" href="/members">Ver miembros →</Link> : <Link className="btn" href="/login">Únete al club →</Link>}
              <Link className="btn o" href="/events">Ver eventos</Link>
            </div>
          </div>
        </section>

        <div className="wrap">
          <div className="qas">
            {TILES.map(([href, ico, t, d]) => (
              <Link key={href} href={href} className="qa"><Ico n={ico} /><span><b>{t}</b><small>{d}</small></span><i>›</i></Link>
            ))}
          </div>

          <div className="cols">
            <section>
              <div className="sec-h"><h2>Próximos eventos</h2><Link href="/events">Ver todos →</Link></div>
              {ev ? (
                <Link href="/events" className="evc" style={flyer}>
                  <div className="evd"><b>{+ev.date.slice(8, 10)}</b><span>{MESES[+ev.date.slice(5, 7) - 1]}</span></div>
                  <h3>{ev.title}</h3>
                  <small>📍 {ev.place}{ev.time ? ` · 🕒 ${ev.time}` : ''}</small>
                </Link>
              ) : <p className="mut">Pronto anunciaremos el próximo evento.</p>}
            </section>

            <section>
              <div className="sec-h"><h2>Galería destacada</h2><Link href="/media">Ver más →</Link></div>
              {gal.length > 0 ? (
                <div className="gal">
                  {gal.map((m) => <Link key={m.id} href={`/media/${m.id}`}><Img src={m.file} />{m.descr && <span>{m.descr}</span>}</Link>)}
                </div>
              ) : <p className="mut">Aún no hay fotos en la galería.</p>}
            </section>

            <section className="side">
              <div className="card">
                <h3>{u ? 'Comparte con el club' : 'Únete a nuestro club'}</h3>
                <p className="mut">{u ? 'Sube fotos y videos de tu Lancer.' : 'Si tienes un Lancer o simplemente amas la marca, ¡eres bienvenido!'}</p>
                <Link className="btn" href={u ? '/media' : '/login'}>{u ? 'Subir fotos' : 'Hazte miembro'} →</Link>
              </div>
              {club.length > 0 && (
                <div className="card">
                  <h3>Redes sociales</h3><p className="mut">Síguenos para no perderte nada</p>
                  <div className="soc mini">
                    {club.map(([k, [name, , svg]]) => <a key={k} href={s['soc_' + k]} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} dangerouslySetInnerHTML={{ __html: svg }} />)}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {cars.length > 0 && (
          <section className="cars">
            <div className="wrap cars-in">
              <div className="cars-t"><h2>Nuestros Lancer</h2><p className="mut">Una familia, diferentes generaciones, misma esencia.</p><Link className="btn o" href="/members">Ver miembros →</Link></div>
              <div className="strip">
                {cars.map((c) => <Link key={c.id} href={`/members/${c.id}`}><Img src={c.car_photo} /><span>{c.version} · {c.nick}</span></Link>)}
              </div>
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
