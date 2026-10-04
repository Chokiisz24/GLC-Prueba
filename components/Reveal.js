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
    let k = 0;
    document.querySelectorAll('main .card, main h1, main h2, main .hero img, main table').forEach((el) => {
      if (el.closest('.hero-full,.auth') || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('rv'); el.style.transitionDelay = (k++ % 8) * 60 + 'ms';
      el.addEventListener('transitionend', () => { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, { once: true });
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);
  return null;
}
