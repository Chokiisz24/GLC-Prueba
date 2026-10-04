import { getSession } from '@/lib/session';
import { verifyEmail } from '../actions';

export default async function VerifyPage() {
  const s = await getSession();
  return (
    <>
      <h1>Confirma tu correo</h1>
      <p>Escribe el código de 6 dígitos enviado a <b>{s.pend || ''}</b> (vigente 10 min).</p>
      <form className="f" action={verifyEmail}>
        <input name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" autoComplete="one-time-code" required />
        <button>Verificar</button>
      </form>
    </>
  );
}
