import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { twofa } from '../actions';

export default async function TwofaPage() {
  if (!(await getSession()).tf) redirect('/login');
  return (
    <>
      <h1>Verificación en 2 pasos</h1>
      <form className="f card" action={twofa}>
        <p className="mut">Escribe el código de 6 dígitos que muestra tu app autenticadora.</p>
        <input name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" autoComplete="one-time-code" required autoFocus />
        <button>Verificar</button>
      </form>
    </>
  );
}
