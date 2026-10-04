import { pageUser } from '@/lib/auth';
import { forgot } from '../actions';

export default async function ForgotPage() {
  await pageUser();
  return (
    <>
      <h1>Recuperar contraseña</h1>
      <form className="f card" action={forgot}>
        <p className="mut">Escribe tu correo y te enviaremos un código para crear una contraseña nueva.</p>
        <input type="email" name="email" placeholder="Correo" required />
        <button>Enviar código</button>
      </form>
    </>
  );
}
