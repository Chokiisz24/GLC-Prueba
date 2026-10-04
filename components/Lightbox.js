'use client';
/* Lightbox: la foto crece desde su miniatura, se desliza entre imagenes (flechas, teclado o
 * deslizando el dedo) y vuelve a su lugar al cerrar. Enlaces <a data-lb="grupo" data-cap="texto" href="foto"> */
import { useEffect } from 'react';

export default function Lightbox() {
  useEffect(() => {
    const d = document;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vt = (fn) => (!calm && d.startViewTransition ? d.startViewTransition(fn) : (fn(), null));
    let box, img, cap, count, list = [], i = 0, x0 = null;

    function build() {
      box = d.createElement('div'); box.id = 'lb';
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
      box.innerHTML = '<button class="lb-x" aria-label="Cerrar">×</button><button class="lb-p" aria-label="Anterior">‹</button><img alt=""><div class="lb-c"></div><div class="lb-k"></div><button class="lb-n" aria-label="Siguiente">›</button>';
      d.body.appendChild(box);
      img = box.querySelector('img'); cap = box.querySelector('.lb-c'); count = box.querySelector('.lb-k');
      box.addEventListener('click', (e) => {
        const c = e.target.className;
        if (e.target === box || c === 'lb-x') close(); else if (c === 'lb-p') go(-1); else if (c === 'lb-n') go(1);
      });
      box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      });
    }
    const thumb = (a) => a?.querySelector('img');
    async function show() {
      const a = list[i];
      img.src = a.href;
      cap.textContent = a.getAttribute('data-cap') || '';
      count.textContent = list.length > 1 ? `${i + 1} / ${list.length}` : '';
      box.classList.toggle('single', list.length < 2);
      try { await img.decode(); } catch {}
    }
    function go(n) {
      if (list.length < 2) return;
      i = (i + n + list.length) % list.length;
      show().then(() => {
        if (!calm) img.animate([{ opacity: 0, transform: `translateX(${n * 48}px) scale(.98)` }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' });
      });
    }
    function open(a) {
      if (!box) build();
      list = [...d.querySelectorAll(`a[data-lb="${a.getAttribute('data-lb')}"]`)]; i = list.indexOf(a);
      const t = thumb(a);
      if (t) t.style.viewTransitionName = 'lb-pic';
      const tr = vt(async () => {
        if (t) t.style.viewTransitionName = '';
        await show();
        img.style.viewTransitionName = 'lb-pic';
        box.classList.add('on');
        d.documentElement.classList.add('lb-open');
      });
      const done = () => { img.style.viewTransitionName = ''; box.querySelector('.lb-x').focus({ preventScroll: true }); };
      tr ? tr.finished.finally(done) : done();
    }
    function close() {
      const t = thumb(list[i]);
      const r = t?.getBoundingClientRect();
      const visible = r && r.bottom > 0 && r.top < innerHeight;
      if (visible) img.style.viewTransitionName = 'lb-pic';
      const tr = vt(() => {
        img.style.viewTransitionName = '';
        box.classList.remove('on');
        d.documentElement.classList.remove('lb-open');
        if (visible) t.style.viewTransitionName = 'lb-pic';
      });
      const done = () => { if (t) t.style.viewTransitionName = ''; img.removeAttribute('src'); list[i]?.focus({ preventScroll: true }); };
      tr ? tr.finished.finally(done) : done();
    }
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a[data-lb]');
      if (!a) return;
      e.preventDefault(); open(a);
    }
    function onKey(e) {
      if (!box || !box.classList.contains('on')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
    }
    d.addEventListener('click', onClick); d.addEventListener('keydown', onKey);
    return () => { d.removeEventListener('click', onClick); d.removeEventListener('keydown', onKey); box?.remove(); d.documentElement.classList.remove('lb-open'); };
  }, []);
  return null;
}
