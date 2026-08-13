import type { Product, ProductForm } from './types';

export async function listProducts(
  db: D1Database,
  options: { limit?: number; offset?: number; activeOnly?: boolean } = {}
) {
  const { limit = 50, offset = 0, activeOnly = false } = options;
  const sql = activeOnly
    ? 'SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM products ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';

  const result = await db.prepare(sql).bind(limit, offset).all<Product>();
  return {
    data: result.results,
    total: result.results.length,
  };
}

export async function getProduct(db: D1Database, id: number) {
  const result = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
  return result || null;
}

export async function createProduct(db: D1Database, form: ProductForm) {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO products (image_url, product_name, product_description, product_parameters, product_tags, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      form.image_url,
      form.product_name,
      form.product_description || null,
      form.product_parameters ? JSON.stringify(form.product_parameters) : null,
      form.product_tags ? JSON.stringify(form.product_tags) : null,
      form.sort_order ?? 0,
      form.is_active !== false ? 1 : 0,
      now
    )
    .run();

  return result.lastRowId;
}

export async function updateProduct(db: D1Database, id: number, form: ProductForm) {
  const now = new Date().toISOString();
  const existing = await getProduct(db, id);
  if (!existing) return false;

  await db
    .prepare(
      `UPDATE products SET
         image_url = COALESCE(?, image_url),
         product_name = COALESCE(?, product_name),
         product_description = COALESCE(?, product_description),
         product_parameters = COALESCE(?, product_parameters),
         product_tags = COALESCE(?, product_tags),
         sort_order = COALESCE(?, sort_order),
         is_active = COALESCE(?, is_active),
         updated_at = ?
       WHERE id = ?`
    )
    .bind(
      form.image_url || null,
      form.product_name || null,
      form.product_description ?? null,
      form.product_parameters ? JSON.stringify(form.product_parameters) : null,
      form.product_tags ? JSON.stringify(form.product_tags) : null,
      form.sort_order ?? null,
      form.is_active !== undefined ? (form.is_active ? 1 : 0) : null,
      now,
      id
    )
    .run();

  return true;
}

export async function deleteProduct(db: D1Database, id: number) {
  const result = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return result.changes > 0;
}

export async function toggleProductActive(db: D1Database, id: number) {
  const result = await db
    .prepare('UPDATE products SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), id)
    .run();
  return result.changes > 0;
}

export async function countProducts(db: D1Database) {
  const result = await db.prepare('SELECT COUNT(*) as count FROM products').first<{ count: number }>();
  const activeResult = await db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first<{ count: number }>();
  return {
    total: result?.count || 0,
    active: activeResult?.count || 0,
  };
}
