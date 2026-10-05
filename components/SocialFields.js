/* Campos opcionales de redes sociales del miembro (los lee readSocials() en app/actions.js) */
import { SOCIAL } from '@/lib/config';

export default function SocialFields({ values = {} }) {
  return (
    <>
      <small className="mut">Redes sociales (opcional): pega el enlace completo de tu perfil. Para WhatsApp usa el formato https://wa.me/52331234567</small>
      {Object.entries(SOCIAL).map(([k, [name]]) => (
        <label key={k}>{name}<input type="url" name={'ms_' + k} defaultValue={values[k] || ''} maxLength={300} placeholder="https://" /></label>
      ))}
    </>
  );
}
