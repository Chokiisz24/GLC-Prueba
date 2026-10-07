'use client';

import { useEffect, useRef, useState } from 'react';

export default function HeroSlides({ slides }) {
  const [current, setCurrent] = useState(0);

  const paused = useRef(false);

  const total = slides.length;


  useEffect(() => {
    if (total < 2) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reducedMotion) return;


    const timer = setInterval(() => {

      if (!paused.current) {
        setCurrent((prev) => (prev + 1) % total);
      }

    }, 6000);


    return () => clearInterval(timer);

  }, [total]);


  return (
    <>
      <div
        className="home-slides"
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
      >

        {slides.map((src, index) => (

          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            className={
              index === current
                ? 'home-slide active'
                : 'home-slide'
            }
            loading={index === 0 ? 'eager' : 'lazy'}
          />

        ))}

      </div>


      {total > 1 && (

        <div
          className="home-slide-dots"
          role="tablist"
          aria-label="Imágenes de portada"
        >

          {slides.map((_, index) => (

            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-label={`Imagen ${index + 1}`}
              className={
                index === current ? 'active' : ''
              }
              onClick={() => setCurrent(index)}
            >

              <span>
                {String(index + 1).padStart(2, '0')}
              </span>

            </button>

          ))}

        </div>

      )}

    </>
  );
}