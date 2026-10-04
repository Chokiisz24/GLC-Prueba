/* Login / registro (pantalla dividida con el logo) */
import LoginTabs from './LoginTabs';
import Page from '@/components/Page';

export const metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  return <Page><LoginTabs initial={sp?.tab === 'reg' ? 'reg' : 'login'} /></Page>;
}
