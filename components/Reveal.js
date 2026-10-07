'use client';

/*
 * Aparición al hacer scroll.
 * Funciona con las páginas antiguas y con Home V3.
 * Respeta "prefers-reduced-motion".
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Reveal() {
  const path = usePathname();

  useEffect(() => {

    /* ==========================================
       Si no existe IntersectionObserver,
       simplemente no animamos.
    ========================================== */

    if (!('IntersectionObserver' in window)) {
      return;
    }


    /* ==========================================
       Respetar configuración del usuario
       "reducir movimiento"
    ========================================== */

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion) {
      return;
    }


    /* ==========================================
       Activamos los estilos .js .rv
    ========================================== */

    document.documentElement.classList.add('js');


    /* ==========================================
       Intersection Observer
    ========================================== */

    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }

          /*
           * Cuando entra en pantalla agregamos
           * la clase "in".
           */
          entry.target.classList.add('in');


          /*
           * Ya no necesitamos seguir observándolo.
           */
          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.12,

        /*
         * La animación empieza ligeramente
         * antes de llegar al final de pantalla.
         */
        rootMargin: '0px 0px -40px 0px',
      }
    );


    /* ==========================================
       ELEMENTOS A ANIMAR
    ========================================== */

    const selectors = [

      /* ------------------------------
         PÁGINAS ORIGINALES
      ------------------------------ */

      'main .card',
      'main h1',
      'main h2',
      'main .hero img',
      'main table',

      /* Home V2 */

      'main .qa',
      'main .sec-h',
      'main .evc',
      'main .gal a',
      'main .cars-t',
      'main .strip a',


      /* ------------------------------
         HOME V3
      ------------------------------ */

      '.home3 .home-section-label',

      '.home3 .home-about-title',
      '.home3 .home-about-copy',

      '.home3 .home-shortcuts',

      '.home3 .home-event',
      '.home3 .home-empty',

      '.home3 .home-gallery-heading',
      '.home3 .home-gallery-item',
      '.home3 .home-gallery-more',

      '.home3 .home-garage-heading',
      '.home3 .home-car-card',
      '.home3 .home-garage-bottom',

      '.home3 .home-join-content',

    ].join(',');


    const elements =
      document.querySelectorAll(selectors);


    elements.forEach((element) => {

      /* ======================================
         NO ANIMAR CIERTAS ÁREAS
      ====================================== */

      /*
       * Hero principal:
       * ya tiene sus propias animaciones.
       */
      if (
        element.closest(
          '.hero-full, .auth, .hero2, .home-hero'
        )
      ) {
        return;
      }


      /*
       * Evitar animar títulos duplicados
       * dentro de contenedores que ya animamos.
       */
      if (
        element.tagName === 'H2' &&
        element.closest(
          '.sec-h, .cars-t, .home-gallery-heading, .home-garage-heading'
        )
      ) {
        return;
      }


      /* ======================================
         ELEMENTOS QUE YA ESTÁN VISIBLES
      ====================================== */

      const rect =
        element.getBoundingClientRect();


      /*
       * Si el elemento ya está visible al cargar
       * la página, no lo ocultamos.
       */
      if (
        rect.top <
        window.innerHeight * 0.92
      ) {
        return;
      }


      /* ======================================
         CASCADA
      ====================================== */

      let index = 0;


      if (element.parentElement) {

        const siblings =
          Array.from(
            element.parentElement.children
          );

        index =
          siblings.indexOf(element);

      }


      /*
       * Limitamos el retraso para evitar
       * animaciones demasiado lentas.
       */
      index =
        Math.min(
          Math.max(index, 0),
          6
        );


      /* ======================================
         ACTIVAR ANIMACIÓN
      ====================================== */

      element.classList.add('rv');


      element.style.transitionDelay =
        `${index * 70}ms`;


      /* ======================================
         LIMPIEZA DESPUÉS DE ANIMAR
      ====================================== */

      const cleanupAnimation = () => {

        element.classList.remove(
          'rv',
          'in'
        );

        element.style.transitionDelay = '';

      };


      element.addEventListener(
        'transitionend',
        cleanupAnimation,
        {
          once: true,
        }
      );


      /* ======================================
         OBSERVAR
      ====================================== */

      observer.observe(element);

    });


    /* ==========================================
       CLEANUP AL CAMBIAR DE PÁGINA
    ========================================== */

    return () => {

      observer.disconnect();

    };

  }, [path]);


  return null;
}