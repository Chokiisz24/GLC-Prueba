'use client';
import { useState } from 'react';
import Link from 'next/link';
import { login, register } from '../actions';

export default function LoginTabs({ initial }) {
  const [tab, setTab] = useState(initial);
  return (
    <div className="auth">
      <div className="auth-l">
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>Iniciar sesión</button>
          <button type="button" role="tab" aria-selected={tab === 'reg'} className={tab === 'reg' ? 'on' : ''} onClick={() => setTab('reg')}>Registrarme</button>
        </div>
        {tab === 'login' ? (
          <form key="l" action={login} className="f">
            <h3>Hola de nuevo</h3><small>Entra con tu cuenta de miembro.</small>
            <input type="email" name="email" placeholder="Correo" required autoComplete="username" />
            <input type="password" name="password" placeholder="Contraseña" required autoComplete="current-password" />
            <button>Entrar</button>
            <small><Link href="/forgot">¿Olvidaste tu contraseña?</Link></small>
          </form>
        ) : (
          <form key="r" action={register} className="f">
            <h3>Crea tu cuenta</h3><small>Te enviaremos un código a tu correo para confirmarlo.</small>
            <input type="email" name="email" placeholder="Correo" required autoComplete="username" />
            <input type="password" name="password" placeholder="Contraseña" minLength={10} required autoComplete="new-password" />
            <small>Mínimo 10 caracteres, con letras y números.</small>
            <button>Enviar código</button>
          </form>
        )}
      </div>
      <div className="auth-r">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/glc-logo.jpg" alt="Guadalajara Lancer Club" />
        {tab === 'login'
          ? <div key="w1" className="wl">Bienvenido<br /><em>de vuelta.</em></div>
          : <div key="w2" className="wl">Únete a la<br /><em>familia GLC.</em></div>}
      </div>
    </div>
  );
}
