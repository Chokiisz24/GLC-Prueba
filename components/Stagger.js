'use client';
/* Cuadricula cuyas tarjetas aparecen en cascada al entrar a la pagina.
 * Al regresar desde un detalle ("← Miembros") no se repite, para que la foto que vuela aterrice limpia. */
import { useState } from 'react';
import Link from 'next/link';

const recentBack = () => typeof window !== 'undefined' && Date.now() - (window.__glcBack || 0) < 1500;

export function StaggerGrid({ className = '', children }) {
  const [calm] = useState(recentBack);
  return <div className={`grid stagger ${calm ? 'calm' : ''} ${className}`}>{children}</div>;
}

// Enlace de "regresar": anima hacia atras y avisa a la cuadricula que no repita la cascada
export function BackLink({ href, children }) {
  return <Link href={href} transitionTypes={['nav-back']} onClick={() => { window.__glcBack = Date.now(); }}>{children}</Link>;
}
