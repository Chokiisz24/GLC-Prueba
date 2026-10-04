'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/', 'Acerca del club'], ['/board', 'Directiva'], ['/events', 'Eventos'], ['/members', 'Miembros'], ['/media', 'Multimedia'], ['/sales', 'Ventas']];

export default function NavLinks() {
  const p = usePathname();
  return (
    <nav>
      {LINKS.map(([href, label]) => {
        const on = href === '/' ? p === '/' : p === href || p.startsWith(href + '/');
        return <Link key={href} href={href} className={on ? 'on' : ''}>{label}</Link>;
      })}
    </nav>
  );
}
