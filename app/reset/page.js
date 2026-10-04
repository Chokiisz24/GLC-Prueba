import { getSession } from '@/lib/session';
import { pageUser } from '@/lib/auth';
import { resetPassword } from '../actions';

export default async function ResetPage() {
  await pageUser();
  const s = await getSession();
  return (
    <>
      <h1>Nueva contraseña</h1>
      <form className="f card" action={resetPassword}>
        <p className="mut">Código enviado a <b>{s.pend_reset || ''}</b> (vigente 10 min).</p>
        <input name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" placeholder="Código de 6 dígitos" autoComplete="one-time-code" required />
        <input type="password" name="password" minLength={10} placeholder="Nueva contraseña (10+, letras y números)" required autoComplete="new-password" />
        <button>Cambiar contraseña</button>
      </form>
    </>
  );
}
