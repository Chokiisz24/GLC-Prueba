'use client';
import { usePathname } from 'next/navigation';

export default function PendingBanner() {
  return usePathname() === '/pending' ? null : <div className="msg">⏳ Tu cuenta esta pendiente de aprobacion por un administrador.</div>;
}
