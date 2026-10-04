import Link from 'next/link';
import { redirect } from 'next/navigation';
import { pageUser } from '@/lib/auth';
import Page from '@/components/Page';

export default async function PendingPage() {
  const u = await pageUser();
  if (!u) redirect('/login');
  if (u.approved) redirect('/');
  return (
    <Page>
      <h1>Solicitud en revisión</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <p style={{ fontSize: '1.1rem' }}>⏳ Tu correo ya está confirmado y tu perfil fue enviado.</p>
        <p>Un administrador revisará tu solicitud. Cuando sea aceptada te enviaremos un correo y podrás subir fotos, comentar y publicar productos.</p>
        <Link className="btn s" href="/profile">Revisar mi perfil</Link>
      </div>
    </Page>
  );
}
