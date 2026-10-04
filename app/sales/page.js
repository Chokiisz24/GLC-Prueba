/* Ventas entre miembros */
import { q, one } from '@/lib/db';
import { pageUser, isAdmin } from '@/lib/auth';
import { productUpload, delProduct } from '../actions';
import UploadForm from '@/components/UploadForm';
import Pager, { curPage } from '@/components/Pager';
import { Img, Hidden, Lines, NeedMsg } from '@/components/Bits';
import Page from '@/components/Page';
import ProductGrid from '@/components/ProductGrid';

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
    <Page>
      <h1>Ventas entre miembros</h1>
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
      <ProductGrid delAction={delProduct} items={list.map((r) => ({
        id: r.id, title: r.title, price: r.price, descr: r.descr, contact: r.contact, photo: r.photo, name: r.name,
        canDelete: !!(ok && (u.id === r.user_id || isAdmin(u))),
      }))} />
      {!list.length && <p className="mut">Todavía no hay productos a la venta.</p>}
      <Pager total={total.c} per={PER} page={page} base="/sales" />
    </Page>
  );
}
