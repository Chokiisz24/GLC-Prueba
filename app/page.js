import Link from 'next/link';
import { getSettings } from '@/lib/config';
import { q } from '@/lib/db';
import { pageUser } from '@/lib/auth';
import { blobOk } from '@/lib/blob';
import { Img } from '@/components/Bits';
import Page from '@/components/Page';
import HomeGauge from '@/components/HomeGauge';

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

const CLUB_LINKS = [
  { href: '/board', n: '01', title: 'Directiva', text: 'Conoce a quienes representan GLC.' },
  { href: '/events', n: '02', title: 'Eventos', text: 'Rodadas, reuniones y próximas rutas.' },
  { href: '/members', n: '03', title: 'Miembros', text: 'La comunidad y sus Mitsubishi Lancer.' },
  { href: '/media', n: '04', title: 'Multimedia', text: 'Fotos y videos del club en movimiento.' },
  { href: '/sales', n: '05', title: 'Ventas', text: 'Publicaciones de la comunidad.' },
];

export default async function Home() {
  const [user, settings] = await Promise.all([pageUser(), getSettings()]);
  const today = new Date().toISOString().slice(0, 10);

  let [events, gallery, cars] = await Promise.all([
    q('SELECT * FROM events WHERE "date" >= $1 ORDER BY "date", "time" LIMIT 1', [today]),
    q(`SELECT id, file, descr FROM media WHERE "type" = 'image' ORDER BY id DESC LIMIT 3`),
    q(`SELECT id, nick, version, car_photo FROM users WHERE verified AND approved AND NOT hidden AND name IS NOT NULL AND car_photo IS NOT NULL ORDER BY created DESC LIMIT 5`),
  ]);

  // Datos demo cuando no hay BD, para poder seguir trabajando el diseño.
  if ((!process.env.DATABASE_URL && !process.env.POSTGRES_URL) || (!events.length && !gallery.length && !cars.length)) {
    events = [{
      id: 1,
      title: 'Night Drive GDL',
      date: '2026-10-18',
      time: '20:00',
      place: 'Guadalajara, Jalisco',
      descr: 'Rodada nocturna y convivencia GLC.',
      flyer: '/Club/gallery-05.jpg',
    }];

    gallery = [
      { id: 1, file: '/Club/gallery-01.jpg', descr: 'Rodada GLC' },
      { id: 2, file: '/Club/gallery-02.jpg', descr: 'Lancer en ruta' },
      { id: 3, file: '/Club/gallery-03.jpg', descr: 'Comunidad GLC' },
    ];

    cars = [
      { id: 1, nick: 'GLC01', version: 'Evolution X', car_photo: '/Club/gallery-04.jpg' },
      { id: 2, nick: 'GLC02', version: 'Lancer GTS', car_photo: '/Club/gallery-06.jpg' },
      { id: 3, nick: 'GLC03', version: 'Ralliart', car_photo: '/Club/gallery-07.jpg' },
      { id: 4, nick: 'GLC04', version: 'Lancer ES', car_photo: '/Club/gallery-08.jpg' },
    ];
  }

  const hero = ['hero1', 'hero2', 'hero3', 'hero4']
    .map((k) => settings[k])
    .find((src) => src && blobOk(src)) || '/bienvenida.jpg';

  const next = events[0];

  const eventDate = next?.date
    ? {
        day: next.date.slice(8, 10),
        month: MONTHS[Number(next.date.slice(5, 7)) - 1],
      }
    : { day: '--', month: 'PRÓX.' };

  return (
    <Page>
      <div className="rally-home rally-compact-home">

        {/* HERO */}
        <section
          className="rally-hero compact-hero"
          id="inicio"
          style={{ '--hero-image': `url("${hero}")` }}
        >
          <div className="rally-hero-grid" />

          <div className="rally-route-line" aria-hidden="true">
            <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
              <path d="M-80 590 C210 520 330 680 590 545 S930 360 1280 430" />
            </svg>
          </div>

          <div className="rally-container rally-hero-inner compact-hero-inner">
            <div className="rally-hero-copy">
              <span className="rally-kicker">
                Guadalajara, Jalisco · Desde 2022
              </span>

              <h1>
                GLC
                <br />
                <em>Lancer</em> Club
              </h1>

              <p>
                {settings.about_text ||
                  'Un club de propietarios y entusiastas del Mitsubishi Lancer en Guadalajara. Rodadas, comunidad y una misma pasión.'}
              </p>

              <div className="rally-actions">
                <Link
                  href={user ? '/members' : '/login'}
                  className="rally-btn primary"
                >
                  {user ? 'Ver miembros' : 'Únete al club'} <span>→</span>
                </Link>

                <Link
                  href="/events"
                  className="rally-btn ghost"
                >
                  Próximos eventos
                </Link>
              </div>
            </div>

            <div className="rally-hero-gauge">
              <HomeGauge />
            </div>
          </div>
        </section>


        {/* TELEMETRÍA + SOBRE GLC */}
        <section className="compact-intro" id="club">

          <div className="rally-telemetry compact-telemetry">
            <div className="rally-container rally-telemetry-grid">

              <div>
                <strong>2022</strong>
                <span>Fundación</span>
              </div>

              <div>
                <strong>GDL</strong>
                <span>Base</span>
              </div>

              <div>
                <strong>JDM</strong>
                <span>Pasión</span>
              </div>

              <div>
                <strong>GLC</strong>
                <span>Comunidad</span>
              </div>

            </div>
          </div>


          <div className="rally-container compact-about-grid">

            <div className="compact-about-media">
              <Img src="/Club/about-club.jpg" />

              <span className="rally-plate">
                GLC · GDL
              </span>
            </div>


            <div className="compact-about-copy">
              <span className="rally-section-tag">
                // Sobre el club
              </span>

              <h2>
                Una pasión.
                <br />
                <em>Muchas rutas.</em>
              </h2>

              <p>
                {settings.about_text ||
                  'Guadalajara Lancer Club reúne propietarios y entusiastas que comparten la pasión por Mitsubishi Lancer, las rodadas y la comunidad.'}
              </p>

              <Link
                href="/members"
                className="rally-text-link"
              >
                Conoce la comunidad <span>→</span>
              </Link>
            </div>

          </div>
        </section>


        {/* EXPLORA GLC */}
        <section className="compact-explore">

          <div className="rally-container">

            <div className="compact-section-title-row">
              <div>
                <span className="rally-section-tag">
                  // Explora GLC
                </span>

                <h2>
                  Todo el club.
                  <br />
                  <em>Sin dar vueltas.</em>
                </h2>
              </div>

              <p>
                Entra directo a la sección que buscas.
              </p>
            </div>


            <div className="compact-link-grid">

              {CLUB_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="compact-link-card"
                >
                  <span className="num">
                    {item.n}
                  </span>

                  <div>
                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.text}
                    </p>
                  </div>

                  <i>↗</i>
                </Link>
              ))}

            </div>

          </div>
        </section>


        {/* AHORA EN GLC: evento + galería */}
        <section className="compact-now">

          <div className="rally-container">

            <div className="compact-section-title-row">

              <div>
                <span className="rally-section-tag">
                  // Ahora en GLC
                </span>

                <h2>
                  Próxima rodada.
                  <br />
                  <em>Últimos momentos.</em>
                </h2>
              </div>


              <div className="compact-now-links">

                <Link
                  href="/events"
                  className="rally-text-link"
                >
                  Eventos <span>→</span>
                </Link>

                <Link
                  href="/media"
                  className="rally-text-link"
                >
                  Multimedia <span>→</span>
                </Link>

              </div>

            </div>


            <div className="compact-now-grid">

              <Link
                href="/events"
                className="compact-event-card"
                style={{
                  '--event-image': `url("${
                    next?.flyer && blobOk(next.flyer)
                      ? next.flyer
                      : '/Club/gallery-05.jpg'
                  }")`
                }}
              >

                <div className="compact-event-date">
                  <strong>
                    {eventDate.day}
                  </strong>

                  <span>
                    {eventDate.month}
                  </span>
                </div>


                <div className="compact-event-copy">
                  <span>
                    PRÓXIMO EVENTO
                  </span>

                  <h3>
                    {next?.title || 'Próxima rodada GLC'}
                  </h3>

                  <p>
                    {next?.place ||
                      next?.descr ||
                      'Guadalajara, Jalisco'}
                  </p>
                </div>

                <i>↗</i>

              </Link>


              <div className="compact-media-grid">

                {gallery.slice(0, 3).map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/media/${item.id}`}
                    className={`compact-media-card m${i + 1}`}
                  >
                    <Img src={item.file} />

                    <span>
                      {item.descr ||
                        `GLC ${String(i + 1).padStart(2, '0')}`}
                    </span>

                    <i>↗</i>
                  </Link>
                ))}

              </div>

            </div>

          </div>
        </section>


        {/* GARAGE */}
        {cars.length > 0 && (

          <section className="compact-garage">

            <div className="rally-container">

              <div className="compact-section-title-row compact-garage-head">

                <div>
                  <span className="rally-section-tag">
                    // Garage
                  </span>

                  <h2>
                    Nuestros <em>Lancer.</em>
                  </h2>
                </div>

                <Link
                  href="/members"
                  className="rally-text-link"
                >
                  Ver miembros <span>→</span>
                </Link>

              </div>


              <div className="compact-cars">

                {cars.slice(0, 5).map((car, i) => (

                  <Link
                    key={car.id}
                    href={`/members/${car.id}`}
                    className="compact-car"
                  >

                    <div className="compact-car-image">

                      <Img src={car.car_photo} />

                      <span>
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <i>↗</i>

                    </div>


                    <div className="compact-car-copy">

                      <h3>
                        {car.version || 'Mitsubishi Lancer'}
                      </h3>

                      <p>
                        @{car.nick || 'GLC'}
                      </p>

                    </div>

                  </Link>

                ))}

              </div>

            </div>

          </section>

        )}


        {/* CTA FINAL */}
        <section
          className="compact-join"
          style={{
            '--join-image': `url("/Club/gallery-09.jpg")`
          }}
        >

          <div className="rally-container compact-join-inner">

            <div>

              <span className="rally-section-tag">
                // Únete
              </span>

              <h2>
                ¿Traes un Lancer?
                <br />
                <em>Ya tenemos algo en común.</em>
              </h2>

            </div>


            <div className="compact-join-actions">

              <p>
                Forma parte de GLC, conoce a la comunidad y rueda con nosotros.
              </p>

              <Link
                href={user ? '/members' : '/login'}
                className="rally-btn primary"
              >
                {user
                  ? 'Ir a miembros'
                  : 'Forma parte de GLC'
                }

                <span>→</span>
              </Link>

            </div>

          </div>

        </section>

      </div>
    </Page>
  );
}