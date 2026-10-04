/* Seguridad: activar / desactivar la verificacion en 2 pasos */
import { redirect } from 'next/navigation';
import { pageUser } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { totpStart, totpOn, totpOff } from '../actions';

export default async function SecurityPage() {
  const u = await pageUser();
  if (!u) redirect('/login');
  const fresh = (await getSession()).totp_new;
  return (
    <>
      <h1>Seguridad</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ marginTop: 0 }}>Verificación en 2 pasos</h2>
        {u.totp ? (
          <>
            <p>✅ Está <b>activada</b>. Al iniciar sesión te pediremos el código de tu app.</p>
            <form className="f wide" action={totpOff}>
              <p className="mut">Para desactivarla confirma tu contraseña y un código actual.</p>
              <input type="password" name="password" placeholder="Contraseña" required autoComplete="current-password" />
              <input name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" placeholder="Código de 6 dígitos" required />
              <button className="danger">Desactivar</button>
            </form>
          </>
        ) : fresh ? (
          <>
            <p>1. En <b>Google Authenticator</b>, Microsoft Authenticator o Authy elige <i>Agregar cuenta → Introducir clave de configuración</i> (tipo: basada en tiempo).</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '.08em' }}>{fresh.match(/.{1,4}/g).join(' ')}</p>
            <p className="mut">Cuenta: {u.email}</p>
            <form className="f wide" action={totpOn}>
              <p>2. Escribe el código de 6 dígitos que aparece en la app:</p>
              <input name="code" inputMode="numeric" maxLength={6} pattern="\d{6}" required />
              <button>Activar</button>
            </form>
          </>
        ) : (
          <>
            <p>Agrega una capa extra de protección: además de tu contraseña, se pedirá un código de tu teléfono.</p>
            <form action={totpStart}><button>Configurar</button></form>
          </>
        )}
      </div>
    </>
  );
}
