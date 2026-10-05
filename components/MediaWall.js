'use client';
/* Muro de multimedia tipo mosaico: piezas de distintos tamanos, informacion al pasar el mouse
 * y videos que se reproducen en silencio al pasar encima (solo con mouse). */
import { useState } from 'react';
import Link from 'next/link';
import { Morph } from './Page';

// Patron del mosaico: cada 10 piezas, una grande, una alta y una ancha. Los videos van anchos.
// Cerca del final no se usan piezas grandes ni altas, para que no queden huecos.
const size = (m, i, n) => {
  const left = n - i - 1;
  if (i % 10 === 0 && left >= 5) return 'big';
  if (m.type === 'video' || (i % 10 === 6 && left >= 1)) return 'wide';
  if (i % 10 === 3 && left >= 3) return 'tall';
  return '';
};

const play = (e) => { if (matchMedia('(hover: hover)').matches) e.currentTarget.querySelector('video')?.play().catch(() => {}); };
const stop = (e) => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = 0.5; } };

// Al regresar desde el visor no se repite la cascada, para que la foto que vuela aterrice limpia
const recentBack = () => typeof window !== 'undefined' && Date.now() - (window.__glcBack || 0) < 1500;

export default function MediaWall({ items }) {
  const [calm] = useState(recentBack);
  return (
    <div className={'wall' + (calm ? ' calm' : '')}>
      {items.map((m, i) => (
        <Link key={m.id} href={`/media/${m.id}`} transitionTypes={['nav-forward']} className={`tile ${size(m, i, items.length)}`}
          style={{ '--i': Math.min(i, 14) }} onPointerEnter={m.type === 'video' ? play : undefined} onPointerLeave={m.type === 'video' ? stop : undefined}
          aria-label={m.descr || (m.type === 'video' ? 'Video' : 'Foto')}>
          <Morph name={`media-${m.id}`}>
            {m.type === 'video'
              ? <video muted loop playsInline preload="metadata" src={`${m.file}#t=0.5`} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={m.file} alt="" loading={i < 6 ? 'eager' : 'lazy'} />}
          </Morph>
          {m.type === 'video' && (
            <span className="tile-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span>
          )}
          <span className="tile-info">
            {m.descr && <span className="tile-d">{m.descr}</span>}
            <span className="tile-by">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.photo ? <img src={m.photo} alt="" /> : <i>{(m.nick || '?')[0]}</i>}
              {m.nick}
              {m.nc > 0 && <span className="tile-c">💬 {m.nc}</span>}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
