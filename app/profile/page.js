/* Mi perfil y mi Lancer (paso 3 del registro; tambien para editar despues) */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { me } from '@/lib/auth';
import { VERSIONS, parseSocials } from '@/lib/config';
import SocialFields from '@/components/SocialFields';
import { saveProfile } from '../actions';
import UploadForm from '@/components/UploadForm';
import Page from '@/components/Page';

export default async function ProfilePage() {
  const u = await me();
  if (!u) redirect('/login');
  return (
    <Page>
      <h1>Mi perfil y mi Lancer</h1>
      <p><Link className="btn s" href="/security">🔐 Seguridad: verificación en 2 pasos</Link></p>
      <p className="mut">Todos los campos son obligatorios.</p>
      <UploadForm action={saveProfile} uid={u.id} kind="profile" className="f card">
        <input name="name" placeholder="Nombre" defaultValue={u.name || ''} maxLength={200} required />
        <input name="nick" placeholder="Apodo (se mostrará en Miembros)" maxLength={30} defaultValue={u.nick || ''} required />
        <input name="city" placeholder="Ciudad" defaultValue={u.city || ''} maxLength={200} required />
        <input name="country" placeholder="País" defaultValue={u.country || ''} maxLength={200} required />
        <input type="number" name="age" placeholder="Edad" min={16} max={99} defaultValue={u.age || ''} required />
        <input type="number" name="year" placeholder="Año del Lancer" min={2000} max={new Date().getFullYear() + 1} defaultValue={u.year || ''} required />
        <select name="version" defaultValue={u.version || ''} required>
          <option value="">Versión...</option>
          {VERSIONS.map((v) => <option key={v}>{v}</option>)}
        </select>
        <input name="color" placeholder="Color del auto" defaultValue={u.color || ''} maxLength={200} required />
        <textarea name="mods" placeholder="Modificaciones (o 'Ninguna')" defaultValue={u.mods || ''} maxLength={200} required />
        <label>Tu foto <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required={!u.photo} /></label>
        <label>Foto del carro <input type="file" name="car_photo" accept="image/jpeg,image/png,image/webp" required={!u.car_photo} /></label>
        <SocialFields values={parseSocials(u.socials)} />
        <button>Guardar</button>
      </UploadForm>
    </Page>
  );
}
