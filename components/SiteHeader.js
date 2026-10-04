'use client';
/* Cabecera: pastilla que se desliza hasta la seccion activa, sombra al hacer scroll
 * y menu desplegable animado en celular (boton ☰). */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/', 'Acerca del club'], ['/board', 'Directiva'], ['/events', 'Eventos'], ['/members', 'Miembros'], ['/media', 'Multimedia'], ['/sales', 'Ventas']];
const isOn = (p, href) => (href === '/' ? p === '/' : p === href || p.startsWith(href + '/'));

export default function SiteHeader({ club, acct }) {
  const p = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null), pillRef = useRef(null), ready = useRef(false);

  // Coloca la pastilla sobre el enlace activo (y la desliza cuando cambia)
  useLayoutEffect(() => {
    const nav = navRef.current, pill = pillRef.current;
    if (!nav || !pill) return;
    const place = () => {
      const a = nav.querySelector('a.on');
      if (!a) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.width = a.offsetWidth + 'px';
      pill.style.height = a.offsetHeight + 'px';
      pill.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
    };
    if (!ready.current) {                       // primera vez: sin animacion
      pill.style.transition = 'none'; place(); pill.getBoundingClientRect(); pill.style.transition = ''; ready.current = true;
    } else place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [p, open]);

  useEffect(() => { setOpen(false); }, [p]);   // cierra el menu al navegar

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <header className={scrolled ? 'scrolled' : ''} style={{ viewTransitionName: 'site-header' }}>
      <div className={'bar' + (open ? ' open' : '')}>
        <Link className="brand" href="/" transitionTypes={['nav-tab']}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/glc-icon.png" alt="GLC" /><span>{club}</span>
        </Link>
        <button type="button" className="burger" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
        <div className="menu" id="menu">
          <div className="menu-in">
            <nav ref={navRef}>
              <span ref={pillRef} className="pill" aria-hidden="true" />
              {LINKS.map(([href, label], i) => (
                <Link key={href} href={href} className={isOn(p, href) ? 'on' : ''} style={{ '--i': i }} transitionTypes={['nav-tab']}
                  aria-current={isOn(p, href) ? 'page' : undefined}>{label}</Link>
              ))}
            </nav>
            <div className="acct" style={{ '--i': LINKS.length }}>{acct}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
