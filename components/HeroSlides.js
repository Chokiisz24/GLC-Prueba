'use client';
/* Carrusel de la portada: varias imagenes con fundido, cambio automatico cada 5.5 s, indicadores 01, 02... clicables.
 * Se pausa al pasar el mouse y no se mueve solo si el usuario prefiere menos movimiento. */
import { useEffect, useRef, useState } from 'react';

export default function HeroSlides({ slides }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!paused.current) setI((x) => (x + 1) % n); }, 5500);
    return () => clearInterval(t);
  }, [n]);

  return (
    <>
      <div className="slides" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {slides.map((src, k) => <img key={src} src={src} alt="" className={k === i ? 'on' : ''} loading={k === 0 ? 'eager' : 'lazy'} />)}
      </div>
      {n > 1 && (
        <div className="dots" role="tablist" aria-label="Imágenes de portada">
          {slides.map((src, k) => (
            <button key={src} type="button" role="tab" aria-selected={k === i} aria-label={`Imagen ${k + 1}`} className={k === i ? 'on' : ''}
              onClick={() => setI(k)}>{String(k + 1).padStart(2, '0')}</button>
          ))}
        </div>
      )}
    </>
  );
}
