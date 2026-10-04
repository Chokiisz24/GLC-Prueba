'use client';
/* Lightbox: vista ampliada de fotos con flechas y teclado. Enlaces <a data-lb="grupo" data-cap="texto" href="foto"> */
import { useEffect } from 'react';

export default function Lightbox() {
  useEffect(() => {
    const d = document;
    let box, img, cap, list = [], i = 0;
    function build() {
      box = d.createElement('div'); box.id = 'lb';
      box.innerHTML = '<button class="lb-x" aria-label="Cerrar">×</button><button class="lb-p" aria-label="Anterior">‹</button><img alt=""><div class="lb-c"></div><button class="lb-n" aria-label="Siguiente">›</button>';
      d.body.appendChild(box); img = box.querySelector('img'); cap = box.querySelector('.lb-c');
      box.addEventListener('click', (e) => {
        const c = e.target.className;
        if (e.target === box || c === 'lb-x') close(); else if (c === 'lb-p') go(-1); else if (c === 'lb-n') go(1);
      });
    }
    function show() { const a = list[i]; img.src = a.href; cap.textContent = a.getAttribute('data-cap') || ''; box.classList.toggle('single', list.length < 2); }
    function go(n) { i = (i + n + list.length) % list.length; show(); }
    function close() { box.classList.remove('on'); img.src = ''; }
    function onClick(e) {
      const a = e.target.closest && e.target.closest('a[data-lb]');
      if (!a) return;
      e.preventDefault(); if (!box) build();
      list = [...d.querySelectorAll(`a[data-lb="${a.getAttribute('data-lb')}"]`)]; i = list.indexOf(a); show(); box.classList.add('on');
    }
    function onKey(e) {
      if (!box || !box.classList.contains('on')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
    }
    d.addEventListener('click', onClick); d.addEventListener('keydown', onKey);
    return () => { d.removeEventListener('click', onClick); d.removeEventListener('keydown', onKey); box?.remove(); };
  }, []);
  return null;
}
