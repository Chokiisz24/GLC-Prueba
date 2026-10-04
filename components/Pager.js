import Link from 'next/link';

export const curPage = (sp) => Math.max(1, parseInt(sp?.pg, 10) || 1);

export default function Pager({ total, per, page, base }) {
  const n = Math.ceil(total / per);
  if (n < 2) return null;
  return (
    <div className="pager">
      {Array.from({ length: n }, (_, k) => k + 1).map((i) => (
        <Link key={i} className={i === page ? 'on' : ''} href={`${base}?pg=${i}`}>{i}</Link>
      ))}
    </div>
  );
}
