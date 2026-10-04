/* Transicion entre paginas: hacia adelante (entrar a un detalle), hacia atras (volver)
 * y fundido entre secciones del menu. Recargas y acciones no animan. */
import { ViewTransition } from 'react';

const T = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', 'nav-tab': 'nav-tab', default: 'none' };

export default function Page({ children }) {
  return (
    <ViewTransition enter={T} exit={T} default="none">
      <div className="page">{children}</div>
    </ViewTransition>
  );
}

// Elemento que "vuela" entre dos paginas (misma name en ambas)
export function Morph({ name, children }) {
  return <ViewTransition name={name} share="morph" default="none">{children}</ViewTransition>;
}
