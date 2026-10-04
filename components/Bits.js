/* Piezas pequenas reutilizables (equivalen a img(), need_msg() y la casilla "confirmar" de index.php) */
import Link from 'next/link';

export function Img({ src, className }) {
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className={className} src={src} alt="" loading="lazy" /> : null;
}

export function NeedMsg({ u, what }) {
  return (
    <p className="mut">
      {u ? `Tu cuenta esta pendiente de aprobacion; podras ${what} cuando un administrador la acepte.`
        : <><Link href="/login">Inicia sesion</Link> para {what}.</>}
    </p>
  );
}

export function Confirm({ form }) {
  return <label className="inl"><input type="checkbox" required form={form} /> confirmar</label>;
}

export function Hidden({ name, value }) {
  return <input type="hidden" name={name} value={value} />;
}

// Texto con saltos de linea (equivale a nl2br(e(...)))
export function Lines({ text }) {
  const parts = String(text ?? '').split('\n');
  return parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <br />}</span>);
}
