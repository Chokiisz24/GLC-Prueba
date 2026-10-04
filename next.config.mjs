/* Cabeceras de seguridad (anti-clickjacking, sniffing y CSP), igual que en core.php */
const dev = process.env.NODE_ENV !== 'production';
const BLOB = 'https://*.public.blob.vercel-storage.com';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB}`,
  `media-src 'self' blob: ${BLOB}`,
  `connect-src 'self' https://vercel.com https://*.vercel-storage.com${dev ? ' ws:' : ''}`,
  'frame-src https://www.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'Content-Security-Policy', value: csp },
      ],
    }];
  },
};
export default nextConfig;
