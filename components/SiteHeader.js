'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/', 'Acerca del club'],
  ['/board', 'Directiva'],
  ['/events', 'Eventos'],
  ['/members', 'Miembros'],
  ['/media', 'Multimedia'],
  ['/sales', 'Ventas'],
];

const isOn = (path, href) =>
  href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);

export default function SiteHeader({ club, acct }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`glc-site-header${scrolled ? ' scrolled' : ''}${open ? ' open' : ''}`}>
      <div className="glc-nav-shell">
        <Link className="glc-nav-brand" href="/" aria-label={club} onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/glc-icon.png" alt="GLC" />
          <span>{club}</span>
        </Link>

        <button
          type="button"
          className="glc-nav-toggle"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="glc-mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="glc-nav-panel" id="glc-mobile-menu">
          {/* Usamos div en vez de <nav> para evitar las reglas globales nav{} del proyecto anterior. */}
          <div className="glc-nav-links" role="navigation" aria-label="Navegación principal">
            {LINKS.map(([href, label]) => {
              const active = isOn(path, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? 'active' : ''}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="glc-nav-account" onClick={() => setOpen(false)}>
            {acct}
          </div>
        </div>
      </div>
    </header>
  );
}
