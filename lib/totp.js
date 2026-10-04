/* lib/totp.js - Verificacion en 2 pasos (TOTP RFC 6238), compatible con Google/Microsoft Authenticator y Authy. */
import crypto from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function b32enc(buf) {
  let bits = '', out = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}

function b32dec(s) {
  let bits = '';
  for (const ch of s.toUpperCase()) { const p = B32.indexOf(ch); if (p >= 0) bits += p.toString(2).padStart(5, '0'); }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export const newSecret = () => b32enc(crypto.randomBytes(10));

export function totpCode(secret, time) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(time / 30)));
  const h = crypto.createHmac('sha1', b32dec(secret)).update(msg).digest();
  const o = h[19] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}

// Tolera +-30 s de desfase del reloj del telefono
export function totpOk(secret, input) {
  const c = String(input ?? '').replace(/\D/g, '');
  if (c.length !== 6 || !secret) return false;
  const t = Math.floor(Date.now() / 1000);
  return [-1, 0, 1].some((i) => crypto.timingSafeEqual(Buffer.from(totpCode(secret, t + 30 * i)), Buffer.from(c)));
}
