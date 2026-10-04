'use client';
/* Ventas: tarjetas que aparecen en cascada; al tocar una, la foto crece hasta una ventana con los detalles
 * y botones para contactar al vendedor (WhatsApp, llamada o correo segun lo que haya escrito). */
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Lines } from './Bits';

function contactLinks(c) {
  const out = [];
  const mail = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(c)?.[0];
  const digits = c.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 13) {
    const intl = digits.length === 10 ? '52' + digits : digits; // numeros de 10 digitos: Mexico
    out.push(['WhatsApp', `https://wa.me/${intl}`, true]);
    out.push(['Llamar', `tel:+${intl}`, false]);
  }
  if (mail) out.push(['Correo', `mailto:${mail}`, false]);
  return out;
}

export default function ProductGrid({ items, delAction }) {
  const [open, setOpen] = useState(null);
  const [calm, setCalm] = useState(false);
  const closeRef = useRef(null), lastCard = useRef(null);

  useEffect(() => { setCalm(matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);

  // Cambia el estado dentro de una View Transition para que la foto "vuele" entre tarjeta y ventana
  const morph = (id, next) => {
    const pic = document.querySelector(`[data-pic="${id}"]`);
    if (calm || !document.startViewTransition || !pic) { setOpen(next); return; }
    if (next) pic.style.viewTransitionName = 'prod-pic';
    const t = document.startViewTransition(() => {
      flushSync(() => setOpen(next));
      pic.style.viewTransitionName = next ? '' : 'prod-pic';
    });
    t.finished.finally(() => { pic.style.viewTransitionName = ''; });
  };

  const show = (r, card) => { lastCard.current = card; morph(r.id, r); };
  const hide = () => { if (!open) return; const id = open.id; morph(id, null); setTimeout(() => lastCard.current?.focus({ preventScroll: true }), 50); };

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('lb-open');
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') hide(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.classList.remove('lb-open'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onCard = (e, r) => {
    if (e.target.closest('form,button,a')) return; // el boton Eliminar no abre la ventana
    show(r, e.currentTarget);
  };

  return (
    <>
      <div className="grid stagger spaced">
        {items.map((r) => (
          <div className="card product" key={r.id} role="button" tabIndex={0} aria-label={`Ver ${r.title}`}
            onClick={(e) => onCard(e, r)} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) show(r, e.currentTarget); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {r.photo && <img data-pic={r.id} src={r.photo} alt="" loading="lazy" />}
            <h3>{r.title}</h3>
            <b className="price">{r.price}</b>
            <p className="clamp"><Lines text={r.descr} /></p>
            <small>Vende: {r.name}</small>
            {r.canDelete && (
              <form action={delAction} style={{ marginTop: '.5rem' }}>
                <input type="hidden" name="id" value={r.id} /><button className="danger">Eliminar</button>
              </form>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="pm" role="dialog" aria-modal="true" aria-label={open.title} onClick={(e) => { if (e.target === e.currentTarget) hide(); }}>
          <div className="pm-card">
            <button ref={closeRef} type="button" className="pm-x" aria-label="Cerrar" onClick={hide}>×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {open.photo && <img className="pm-pic" src={open.photo} alt={open.title} style={{ viewTransitionName: 'prod-pic' }} />}
            <div className="pm-body">
              <h2>{open.title}</h2>
              <b className="price">{open.price}</b>
              <p><Lines text={open.descr} /></p>
              <p className="mut">Vende: {open.name}<br />Contacto: {open.contact}</p>
              <div className="btns">
                {contactLinks(open.contact).map(([label, href, ext]) => (
                  <a key={label} className={'btn' + (label === 'WhatsApp' ? '' : ' s')} href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>
                ))}
              </div>
              <p className="mut" style={{ fontSize: '.8rem', marginBottom: 0 }}>Las ventas se tratan directamente con el vendedor; el club no interviene.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
