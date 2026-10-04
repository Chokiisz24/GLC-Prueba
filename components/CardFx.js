'use client';
/* Tarjetas: se inclinan en 3D siguiendo el cursor con un brillo tipo pintura de auto.
 * Solo con mouse (no en celular) y nunca si el usuario prefiere menos movimiento. */
import { useEffect } from 'react';

const SEL = 'main .grid:not(.no-tilt) > .card';

export default function CardFx() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let el = null, ev = null, raf = 0;
    const reset = (c) => { c.classList.remove('tilt'); for (const k of ['--rx', '--ry', '--mx', '--my']) c.style.removeProperty(k); };
    const apply = () => {
      raf = 0;
      if (!el || !ev) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
      el.classList.add('tilt');
    };
    const move = (e) => {
      const c = e.target.closest?.(SEL) || null;
      if (c !== el) { if (el) reset(el); el = c; }
      if (!el) return;
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => { if (el) reset(el); el = null; };
    document.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      document.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      cancelAnimationFrame(raf); leave();
    };
  }, []);
  return null;
}
