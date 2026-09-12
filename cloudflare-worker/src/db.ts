import type {
  Product, ProductForm,
  Category, CategoryForm,
  Moment, MomentForm,
  Inquiry, InquiryForm, InquiryReplyForm,
} from './types';

const now = () => new Date().toISOString();
const toBool = (b?: boolean) => (b === false ? 0 : 1);

// ============================================================
// 产品
// ============================================================
export async function listProducts(
  db: D1Database,
  options: {
    limit?: number;
    offset?: number;
    activeOnly?: boolean;
    categoryId?: number;
    search?: string;
  } = {}
) {
  const { limit = 50, offset = 0, activeOnly = false, categoryId, search } = options;
  const where: string[] = [];
  const params: any[] = [];

  if (activeOnly) where.push('is_active = 1');
  if (categoryId) { where.push('category_id = ?'); params.push(categoryId); }
  if (search) {
    where.push('(product_name LIKE ? OR product_description LIKE ? OR product_tags LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = await db
    .prepare(`SELECT COUNT(*) as c FROM products ${whereSql}`)
    .bind(...params)
    .first<{ c: number }>();

  params.push(limit, offset);
  const result = await db
    .prepare(
      `SELECT * FROM products ${whereSql}
       ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?`
    )
    .bind(...params)
    .all<Product>();

  return {
    data: result.results,
    total: total?.c ?? 0,
  };
}

export async function getProduct(db: D1Database, id: number) {
  return (
    (await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>()) || null
  );
}

export async function createProduct(db: D1Database, form: ProductForm) {
  const ts = now();
  const r = await db
    .prepare(
      `INSERT INTO products
         (category_id, image_url, product_name, product_description,
          product_parameters, product_tags, sort_order, is_active, carousel_fixed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      form.category_id ?? null,
      form.image_url,
      form.product_name,
      form.product_description || null,
      form.product_parameters ? JSON.stringify(form.product_parameters) : null,
      form.product_tags ? JSON.stringify(form.product_tags) : null,
      form.sort_order ?? 0,
      toBool(form.is_active),
      form.carousel_fixed ? 1 : 0,
      ts
    )
    .run();
  return r.lastRowId;
}

export async function updateProduct(db: D1Database, id: number, form: ProductForm) {
  const existing = await getProduct(db, id);
  if (!existing) return false;
  await db
    .prepare(
      `UPDATE products SET
         category_id          = COALESCE(?, category_id),
         image_url            = COALESCE(?, image_url),
         product_name         = COALESCE(?, product_name),
         product_description  = ?,
         product_parameters   = COALESCE(?, product_parameters),
         product_tags         = COALESCE(?, product_tags),
         sort_order           = COALESCE(?, sort_order),
         is_active            = COALESCE(?, is_active),
         carousel_fixed       = COALESCE(?, carousel_fixed),
         updated_at           = ?
       WHERE id = ?`
    )
    .bind(
      form.category_id === undefined ? null : form.category_id,
      form.image_url || null,
      form.product_name || null,
      form.product_description ?? null,
      form.product_parameters ? JSON.stringify(form.product_parameters) : null,
      form.product_tags ? JSON.stringify(form.product_tags) : null,
      form.sort_order ?? null,
      form.is_active === undefined ? null : toBool(form.is_active),
      form.carousel_fixed === undefined ? null : toBool(form.carousel_fixed),
      now(),
      id
    )
    .run();
  return true;
}

export async function deleteProduct(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return r.changes > 0;
}

export async function toggleProductActive(db: D1Database, id: number) {
  const r = await db
    .prepare('UPDATE products SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END, updated_at=? WHERE id = ?')
    .bind(now(), id)
    .run();
  return r.changes > 0;
}

export async function toggleProductCarousel(db: D1Database, id: number) {
  const r = await db
    .prepare('UPDATE products SET carousel_fixed = CASE WHEN carousel_fixed=1 THEN 0 ELSE 1 END, updated_at=? WHERE id = ?')
    .bind(now(), id)
    .run();
  return r.changes > 0;
}

/**
 * 产品实拍轮播：优先取「固定轮播」的上架产品（按 sort_order），
 * 不足 limit 时用其余上架产品随机补足。
 */
export async function listCarouselProducts(db: D1Database, limit = 10) {
  const fixed = (
    await db
      .prepare('SELECT * FROM products WHERE is_active=1 AND carousel_fixed=1 ORDER BY sort_order ASC, id DESC LIMIT ?')
      .bind(limit)
      .all<Product>()
  ).results;

  if (fixed.length >= limit) return fixed;

  const excludeIds = fixed.map((p) => p.id).filter((id): id is number => typeof id === 'number');
  const remaining = limit - fixed.length;
  const placeholders = excludeIds.map(() => '?').join(',');
  const sql = `SELECT * FROM products WHERE is_active=1${excludeIds.length ? ` AND id NOT IN (${placeholders})` : ''} ORDER BY RANDOM() LIMIT ?`;
  const params = excludeIds.length ? [...excludeIds, remaining] : [remaining];
  const random = (await db.prepare(sql).bind(...params).all<Product>()).results;

  return [...fixed, ...random];
}

export async function countProducts(db: D1Database) {
  const total = await db.prepare('SELECT COUNT(*) c FROM products').first<{ c: number }>();
  const active = await db.prepare('SELECT COUNT(*) c FROM products WHERE is_active=1').first<{ c: number }>();
  return { total: total?.c ?? 0, active: active?.c ?? 0 };
}

// ============================================================
// 产品分类
// ============================================================
export async function listCategories(db: D1Database, opts: { activeOnly?: boolean } = {}) {
  const sql = opts.activeOnly
    ? 'SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order ASC, id DESC'
    : 'SELECT * FROM categories ORDER BY sort_order ASC, id DESC';
  return (await db.prepare(sql).all<Category>()).results;
}
export async function getCategory(db: D1Database, id: number) {
  return (await db.prepare('SELECT * FROM categories WHERE id=?').bind(id).first<Category>()) || null;
}
export async function createCategory(db: D1Database, form: CategoryForm) {
  const r = await db
    .prepare(
      `INSERT INTO categories (name, name_en, slug, sort_order, is_active, created_at) VALUES (?,?,?,?,?,?)`
    )
    .bind(form.name, form.name_en ?? null, form.slug ?? null, form.sort_order ?? 0, toBool(form.is_active), now())
    .run();
  return r.lastRowId;
}
export async function updateCategory(db: D1Database, id: number, form: CategoryForm) {
  const existing = await getCategory(db, id);
  if (!existing) return false;
  await db
    .prepare(
      `UPDATE categories SET
         name       = COALESCE(?, name),
         name_en    = COALESCE(?, name_en),
         slug       = COALESCE(?, slug),
         sort_order = COALESCE(?, sort_order),
         is_active  = COALESCE(?, is_active),
         updated_at = ?
       WHERE id = ?`
    )
    .bind(
      form.name || null,
      form.name_en ?? null,
      form.slug ?? null,
      form.sort_order ?? null,
      form.is_active === undefined ? null : toBool(form.is_active),
      now(),
      id
    )
    .run();
  return true;
}
export async function deleteCategory(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM categories WHERE id=?').bind(id).run();
  return r.changes > 0;
}

// ============================================================
// 工厂实拍（朋友圈式动态）
// ============================================================
export async function listMoments(
  db: D1Database,
  opts: { activeOnly?: boolean; limit?: number } = {}
) {
  const where = opts.activeOnly ? 'WHERE is_active=1' : '';
  const params: any[] = [];
  const limit = opts.limit ? ' LIMIT ?' : '';
  if (opts.limit) params.push(opts.limit);
  return (
    await db
      .prepare(`SELECT * FROM moments ${where} ORDER BY created_at DESC, id DESC${limit}`)
      .bind(...params)
      .all<Moment>()
  ).results;
}
export async function getMoment(db: D1Database, id: number) {
  return (await db.prepare('SELECT * FROM moments WHERE id=?').bind(id).first<Moment>()) || null;
}
export async function createMoment(db: D1Database, form: MomentForm) {
  const r = await db
    .prepare('INSERT INTO moments (content, images, is_active, created_at) VALUES (?,?,?,?)')
    .bind(
      form.content ?? null,
      JSON.stringify(form.images ?? []),
      toBool(form.is_active),
      now()
    )
    .run();
  return r.lastRowId;
}
export async function updateMoment(db: D1Database, id: number, form: MomentForm) {
  const e = await getMoment(db, id);
  if (!e) return false;
  await db
    .prepare(
      `UPDATE moments SET
         content    = COALESCE(?, content),
         images     = COALESCE(?, images),
         is_active  = COALESCE(?, is_active),
         updated_at = ?
       WHERE id = ?`
    )
    .bind(
      form.content ?? null,
      form.images ? JSON.stringify(form.images) : null,
      form.is_active === undefined ? null : toBool(form.is_active),
      now(),
      id
    )
    .run();
  return true;
}
export async function deleteMoment(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM moments WHERE id=?').bind(id).run();
  return r.changes > 0;
}

// ============================================================
// 询盘
// ============================================================
export async function listInquiries(
  db: D1Database,
  opts: { status?: string; limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = opts;
  const where = opts.status ? 'WHERE status = ?' : '';
  const params = opts.status ? [opts.status] : [];

  const total = await db
    .prepare(`SELECT COUNT(*) c FROM inquiries ${where}`)
    .bind(...params)
    .first<{ c: number }>();

  params.push(limit, offset);
  const result = await db
    .prepare(`SELECT * FROM inquiries ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .bind(...params)
    .all<Inquiry>();

  return { data: result.results, total: total?.c ?? 0 };
}
export async function getInquiry(db: D1Database, id: number) {
  return (await db.prepare('SELECT * FROM inquiries WHERE id=?').bind(id).first<Inquiry>()) || null;
}
export async function createInquiry(db: D1Database, form: InquiryForm) {
  const r = await db
    .prepare(
      `INSERT INTO inquiries (name, company, email, phone, country, product_id, message, status) VALUES (?,?,?,?,?,?,?,'new')`
    )
    .bind(
      form.name,
      form.company ?? null,
      form.email ?? null,
      form.phone ?? null,
      form.country ?? null,
      form.product_id ?? null,
      form.message ?? null
    )
    .run();
  return r.lastRowId;
}
export async function replyInquiry(db: D1Database, id: number, form: InquiryReplyForm) {
  const e = await getInquiry(db, id);
  if (!e) return false;
  const newStatus = form.status ?? (e.status === 'new' ? 'replied' : e.status);
  const repliedAt = e.replied_at ?? now();
  const replyNote = form.reply_note ?? e.reply_note;
  await db
    .prepare('UPDATE inquiries SET status=?, replied_at=?, reply_note=? WHERE id=?')
    .bind(newStatus, repliedAt, replyNote, id)
    .run();
  return true;
}
export async function deleteInquiry(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM inquiries WHERE id=?').bind(id).run();
  return r.changes > 0;
}
export async function countInquiries(db: D1Database) {
  const total = await db.prepare('SELECT COUNT(*) c FROM inquiries').first<{ c: number }>();
  const n = await db.prepare("SELECT COUNT(*) c FROM inquiries WHERE status='new'").first<{ c: number }>();
  return { total: total?.c ?? 0, new: n?.c ?? 0 };
}

// ============================================================
// 总统计
// ============================================================
export async function statsAll(db: D1Database) {
  const p = await countProducts(db);
  const i = await countInquiries(db);
  const cat = await db.prepare('SELECT COUNT(*) c FROM categories WHERE is_active=1').first<{ c: number }>();
  const mom = await db.prepare('SELECT COUNT(*) c FROM moments WHERE is_active=1').first<{ c: number }>();
  return {
    products: p,
    inquiries: i,
    categories: cat?.c ?? 0,
    moments: mom?.c ?? 0,
  };
}
