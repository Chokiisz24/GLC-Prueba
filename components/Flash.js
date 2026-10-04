'use client';
/* Aviso de exito/error despues de una accion. Se borra la cookie al mostrarlo y se oculta al cambiar de pagina. */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Flash({ f }) {
  const path = usePathname();
  const [cur, setCur] = useState(f ? { ...f, path } : null);
  useEffect(() => {
    setCur(f ? { ...f, path } : null);
    if (f) document.cookie = 'glc_f=; Max-Age=0; path=/';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f?.id]);
  if (!cur || cur.path !== path) return null;
  return <div key={cur.id} className={'msg' + (cur.t === 'err' ? ' err' : '')} role="status">{cur.m}</div>;
}
