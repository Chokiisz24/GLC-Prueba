/* app/layout.js - Estructura comun: tema personalizable, cabecera, avisos, pie con redes sociales. */
import Link from 'next/link';
import './globals.css';
import { getSettings, SOCIAL } from '@/lib/config';
import { me, isAdmin } from '@/lib/auth';
import { one } from '@/lib/db';
import { readFlash } from '@/lib/flash';
import { blobOk } from '@/lib/blob';
import { logout } from './actions';
import SiteHeader from '@/components/SiteHeader';
import CardFx from '@/components/CardFx';
import Flash from '@/components/Flash';
import Lightbox from '@/components/Lightbox';
import Reveal from '@/components/Reveal';
import PendingBanner from '@/components/PendingBanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const s = await getSettings();
  return { title: s.club_name, icons: { icon: '/glc-favicon.png', apple: '/glc-favicon.png' } };
}

function themeCss(s) {
  const custom = !!s.c_bg; // sin colores personalizados, el sitio sigue el modo claro/oscuro del dispositivo
  let css = `:root{--a:${s.c_accent};--bg:${s.c_bg || '#f5f5f7'};--card:${s.c_card || '#ffffff'};--t:${s.c_text || '#1d1d1f'};--font:${s.font};`
    + `--line:color-mix(in srgb,var(--t) 12%,transparent);--mut:color-mix(in srgb,var(--t) 58%,transparent)}`;
  if (!custom) css += '@media(prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--t:#f5f5f7}}';
  if (s.bg_img && blobOk(s.bg_img)) {
    const dim = Math.max(0, Math.min(90, parseInt(s.bg_dim, 10) || 0)) / 100;
    css += `body{background-image:linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})),url("${s.bg_img}");background-size:cover;background-position:center;background-attachment:fixed}`;
  }
  return css.replace(/</g, '');
}

export default async function RootLayout({ children }) {
  const [s, u, f] = await Promise.all([getSettings(), me(), readFlash()]);
  const pend = isAdmin(u)
    ? (await one('SELECT COUNT(*) AS c FROM users WHERE verified AND NOT approved AND NOT hidden AND name IS NOT NULL')).c : 0;
  const links = Object.entries(SOCIAL).filter(([k]) => s['soc_' + k]);

  return (
    <html lang="es">
      <head><style dangerouslySetInnerHTML={{ __html: themeCss(s) }} /></head>
      <body>
        <SiteHeader club={s.club_name} acct={
          <>
            {isAdmin(u) && <Link className="btn s" href="/admin" transitionTypes={['nav-tab']}>Admin{pend ? ` (${pend})` : ''}</Link>}
            {u ? (
              <>
                <Link className="btn s" href="/profile" transitionTypes={['nav-tab']}>Mi perfil</Link>
                <form action={logout}><button className="s">Salir</button></form>
              </>
            ) : <Link className="btn" href="/login" transitionTypes={['nav-tab']}>Entrar</Link>}
          </>
        } />
        <Flash f={f} />
        {u && !u.approved && <PendingBanner />}
        <main>{children}</main>
        <footer className="foot">
          <div className="foot-in">
            <Link href="/" className="foot-brand"><img src="/glc-icon.png" alt="GLC" /><span>{s.club_name}</span></Link>
            <div className="foot-nav">
              {[['/', 'Inicio'], ['/board', 'Directiva'], ['/events', 'Eventos'], ['/members', 'Miembros'], ['/media', 'Multimedia'], ['/sales', 'Ventas']].map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
            </div>
            <div className="foot-r">
              <span className="tag">LANCERS UNIDOS, SIEMPRE <i>///</i></span>
              {links.length > 0 && (
                <div className="soc">
                  {links.map(([k, [name, , svg]]) => (
                    <a key={k} href={s['soc_' + k]} target="_blank" rel="noopener noreferrer" aria-label={name} title={name} dangerouslySetInnerHTML={{ __html: svg }} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="foot-c"><span>© {new Date().getFullYear()} {s.club_name}. Todos los derechos reservados.</span><span>ランサーは永遠に</span></div>
        </footer>
        <Lightbox />
        <CardFx />
        <Reveal />
      </body>
    </html>
  );
}
