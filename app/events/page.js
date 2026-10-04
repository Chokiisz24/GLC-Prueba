/* Eventos: proximos y pasados, con flyer y mapa de Google. Los administradores crean y eliminan. */
import { q } from '@/lib/db';
import { pageUser, isAdmin } from '@/lib/auth';
import { todayMx, fdate } from '@/lib/config';
import { eventAdd, eventDel } from '../actions';
import UploadForm from '@/components/UploadForm';
import { Confirm, Hidden, Lines } from '@/components/Bits';
import Page from '@/components/Page';

export const metadata = { title: 'Eventos' };

function EventCard({ e, admin }) {
  const link = e.maps_url || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.place);
  return (
    <div className={'card ev' + (e.flyer ? '' : ' ev1')}>
      {e.flyer && (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={e.flyer} data-lb="ev" data-cap={e.title}><img className="fly" src={e.flyer} alt="Flyer" /></a>
      )}
      <div>
        <h2>{e.title}</h2>
        <p><b>📅 {fdate(e.date)}</b>{e.time && ` · 🕒 ${e.time}`}<br />📍 {e.place}</p>
        {e.descr && <p><Lines text={e.descr} /></p>}
        <iframe className="map" loading="lazy" title="Mapa" referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodeURIComponent(e.place)}&output=embed`} />
        <p><a className="btn" href={link} target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a></p>
        {admin && (
          <form action={eventDel} className="row" style={{ marginTop: 0 }}>
            <Hidden name="id" value={e.id} /><Confirm /> <button className="danger">Eliminar evento</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const u = await pageUser(), admin = isAdmin(u), today = todayMx();
  const [up, past] = await Promise.all([
    q('SELECT * FROM events WHERE "date" >= $1 ORDER BY "date", "time"', [today]),
    q('SELECT * FROM events WHERE "date" < $1 ORDER BY "date" DESC LIMIT 12', [today]),
  ]);
  return (
    <Page>
      <h1>Eventos</h1>
      {admin && (
        <details style={{ marginBottom: '1.5rem' }}>
          <summary className="btn">+ Crear evento</summary>
          <UploadForm action={eventAdd} uid={u.id} className="f card" style={{ marginTop: '1rem' }}>
            <label>Nombre del evento<input name="title" maxLength={120} required /></label>
            <label>Fecha<input type="date" name="date" min={today} required /></label>
            <label>Hora (opcional)<input type="time" name="time" /></label>
            <label>Ubicación (lugar o dirección, se mostrará en el mapa)<input name="place" maxLength={200} placeholder="Ej. Plaza Andares, Zapopan, Jalisco" required /></label>
            <label>Enlace de Google Maps (opcional)<input type="url" name="maps_url" placeholder="https://maps.app.goo.gl/..." /></label>
            <label>Descripción<textarea name="descr" rows={4} maxLength={2000} /></label>
            <label>Flyer (imagen, opcional)<input type="file" name="flyer" accept="image/jpeg,image/png,image/webp" /></label>
            <button>Publicar evento</button>
          </UploadForm>
        </details>
      )}
      {up.map((e) => <EventCard key={e.id} e={e} admin={admin} />)}
      {!up.length && <p className="mut">No hay eventos próximos por ahora.</p>}
      {past.length > 0 && <><h2>Eventos pasados</h2>{past.map((e) => <EventCard key={e.id} e={e} admin={admin} />)}</>}
    </Page>
  );
}
