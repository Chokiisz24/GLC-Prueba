'use client';
/* Aparicion al hacer scroll. Solo anima lo que esta fuera de pantalla; respeta "reducir movimiento". */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    // Incluye los bloques del inicio (accesos, evento, galeria, tira de Lancers). El retraso depende del lugar entre hermanos: efecto en cascada.
    const SEL = 'main .card, main h1, main h2, main .hero img, main table, main .qa, main .sec-h, main .evc, main .gal a, main .cars-t, main .strip a';
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.closest('.hero-full,.auth,.hero2') || el.getBoundingClientRect().top < innerHeight) return;
      if (el.tagName === 'H2' && el.closest('.sec-h,.cars-t')) return;   // el titulo ya se anima con su contenedor
      const idx = el.parentElement ? Math.min(5, [...el.parentElement.children].indexOf(el)) : 0;
      el.classList.add('rv'); el.style.transitionDelay = idx * 70 + 'ms';
      el.addEventListener('transitionend', () => { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, { once: true });
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);
  return null;
}
