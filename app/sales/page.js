/* Ventas entre miembros */
import { q, one } from '@/lib/db';
import { pageUser, isAdmin } from '@/lib/auth';
import { productUpload, delProduct } from '../actions';
import UploadForm from '@/components/UploadForm';
import Pager, { curPage } from '@/components/Pager';
import { Img, Hidden, Lines, NeedMsg } from '@/components/Bits';

export const metadata = { title: 'Ventas' };
const PER = 12;

export default async function SalesPage({ searchParams }) {
  const u = await pageUser(), ok = u?.approved;
  const page = curPage(await searchParams);
  const [list, total] = await Promise.all([
    q(`SELECT p.*, u.nick AS name FROM products p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT ${PER} OFFSET $1`, [(page - 1) * PER]),
    one('SELECT COUNT(*) AS c FROM products'),
  ]);
  return (
    <>
      <h1>Productos a la venta</h1>
      <p className="mut">Las ventas se tratan directamente con el vendedor; el club no interviene.</p>
      {!ok ? <NeedMsg u={u} what="publicar productos" /> : (
        <details>
          <summary className="btn">+ Publicar producto</summary>
          <UploadForm action={productUpload} uid={u.id} className="f" style={{ marginTop: '1rem' }}>
            <input name="title" placeholder="Producto" maxLength={100} required />
            <textarea name="descr" placeholder="Descripción" maxLength={800} required />
            <input name="price" placeholder="Precio (ej. $1,500 MXN)" maxLength={40} required />
            <input name="contact" placeholder="Contacto (teléfono / WhatsApp / correo)" maxLength={100} required />
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
            <button>Publicar</button>
          </UploadForm>
        </details>
      )}
      <div className="grid" style={{ marginTop: '1rem' }}>
        {list.map((r) => (
          <div className="card" key={r.id}>
            <Img src={r.photo} />
            <h3>{r.title}</h3>
            <b style={{ color: 'var(--a)' }}>{r.price}</b>
            <p><Lines text={r.descr} /></p>
            <small>Vende: {r.name}<br />📞 {r.contact}</small>
            {ok && (u.id === r.user_id || isAdmin(u)) && (
              <form action={delProduct} style={{ marginTop: '.5rem' }}><Hidden name="id" value={r.id} /><button className="danger">Eliminar</button></form>
            )}
          </div>
        ))}
      </div>
      <Pager total={total.c} per={PER} page={page} base="/sales" />
    </>
  );
}
