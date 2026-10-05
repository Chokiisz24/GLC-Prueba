'use client';
/* Selector segmentado (ej. Todo · Fotos · Videos) con pastilla que se desliza a la opcion activa. */
import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

export default function Seg({ items, active, label }) {
  const ref = useRef(null), pill = useRef(null), ready = useRef(false);
  useLayoutEffect(() => {
    const a = ref.current?.querySelector('a.on'), p = pill.current;
    if (!a || !p) return;
    if (!ready.current) p.style.transition = 'none';
    p.style.width = a.offsetWidth + 'px';
    p.style.transform = `translateX(${a.offsetLeft}px)`;
    if (!ready.current) { p.getBoundingClientRect(); p.style.transition = ''; ready.current = true; }
  }, [active]);
  return (
    <div className="seg2" role="navigation" ref={ref} aria-label={label}>
      <span className="seg2-pill" ref={pill} aria-hidden="true" />
      {items.map(([key, text, href, n]) => (
        <Link key={key} href={href} scroll={false} className={key === active ? 'on' : ''} aria-current={key === active ? 'page' : undefined}>
          {text}{n !== undefined && <span className="seg2-n">{n}</span>}
        </Link>
      ))}
    </div>
  );
}
