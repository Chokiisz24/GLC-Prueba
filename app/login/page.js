/* Login / registro (pantalla dividida con el logo) */
import LoginTabs from './LoginTabs';

export const metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  return <LoginTabs initial={sp?.tab === 'reg' ? 'reg' : 'login'} />;
}
