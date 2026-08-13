import type {
  Product, ProductForm,
  Category, CategoryForm,
  Banner, BannerForm,
  GalleryImage, GalleryImageForm,
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
          product_parameters, product_tags, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
// Banner
// ============================================================
export async function listBanners(
  db: D1Database,
  opts: { activeOnly?: boolean; lang?: string } = {}
) {
  const where: string[] = [];
  const params: any[] = [];
  if (opts.activeOnly) where.push('is_active = 1');
  if (opts.lang) {
    where.push('(lang = ? OR lang = ?)');
    params.push(opts.lang, 'all');
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return (
    await db
      .prepare(`SELECT * FROM banners ${whereSql} ORDER BY sort_order ASC, id DESC`)
      .bind(...params)
      .all<Banner>()
  ).results;
}
export async function getBanner(db: D1Database, id: number) {
  return (await db.prepare('SELECT * FROM banners WHERE id=?').bind(id).first<Banner>()) || null;
}
export async function createBanner(db: D1Database, form: BannerForm) {
  const r = await db
    .prepare(
      `INSERT INTO banners (image_url, title, subtitle, link_url, lang, sort_order, is_active, created_at) VALUES (?,?,?,?,?,?,?,?)`
    )
    .bind(
      form.image_url,
      form.title ?? null,
      form.subtitle ?? null,
      form.link_url ?? null,
      form.lang ?? 'zh',
      form.sort_order ?? 0,
      toBool(form.is_active),
      now()
    )
    .run();
  return r.lastRowId;
}
export async function updateBanner(db: D1Database, id: number, form: BannerForm) {
  const e = await getBanner(db, id);
  if (!e) return false;
  await db
    .prepare(
      `UPDATE banners SET
         image_url  = COALESCE(?, image_url),
         title      = COALESCE(?, title),
         subtitle   = COALESCE(?, subtitle),
         link_url   = COALESCE(?, link_url),
         lang       = COALESCE(?, lang),
         sort_order = COALESCE(?, sort_order),
         is_active  = COALESCE(?, is_active),
         updated_at = ?
       WHERE id = ?`
    )
    .bind(
      form.image_url || null,
      form.title ?? null,
      form.subtitle ?? null,
      form.link_url ?? null,
      form.lang ?? null,
      form.sort_order ?? null,
      form.is_active === undefined ? null : toBool(form.is_active),
      now(),
      id
    )
    .run();
  return true;
}
export async function deleteBanner(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM banners WHERE id=?').bind(id).run();
  return r.changes > 0;
}

// ============================================================
// 工厂相册
// ============================================================
export async function listGallery(
  db: D1Database,
  opts: { activeOnly?: boolean; category?: string; limit?: number } = {}
) {
  const where: string[] = [];
  const params: any[] = [];
  if (opts.activeOnly) where.push('is_active=1');
  if (opts.category) { where.push('category = ?'); params.push(opts.category); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = opts.limit ? ' LIMIT ?' : '';
  if (opts.limit) params.push(opts.limit);
  return (
    await db
      .prepare(`SELECT * FROM gallery_images ${whereSql} ORDER BY sort_order ASC, id DESC${limit}`)
      .bind(...params)
      .all<GalleryImage>()
  ).results;
}
export async function getGalleryImage(db: D1Database, id: number) {
  return (await db.prepare('SELECT * FROM gallery_images WHERE id=?').bind(id).first<GalleryImage>()) || null;
}
export async function createGalleryImage(db: D1Database, form: GalleryImageForm) {
  const r = await db
    .prepare(
      `INSERT INTO gallery_images (image_url, title, description, category, sort_order, is_active, created_at) VALUES (?,?,?,?,?,?,?)`
    )
    .bind(
      form.image_url,
      form.title ?? null,
      form.description ?? null,
      form.category ?? 'factory',
      form.sort_order ?? 0,
      toBool(form.is_active),
      now()
    )
    .run();
  return r.lastRowId;
}
export async function updateGalleryImage(db: D1Database, id: number, form: GalleryImageForm) {
  const e = await getGalleryImage(db, id);
  if (!e) return false;
  await db
    .prepare(
      `UPDATE gallery_images SET
         image_url   = COALESCE(?, image_url),
         title       = COALESCE(?, title),
         description = COALESCE(?, description),
         category    = COALESCE(?, category),
         sort_order  = COALESCE(?, sort_order),
         is_active   = COALESCE(?, is_active),
         updated_at  = ?
       WHERE id = ?`
    )
    .bind(
      form.image_url || null,
      form.title ?? null,
      form.description ?? null,
      form.category ?? null,
      form.sort_order ?? null,
      form.is_active === undefined ? null : toBool(form.is_active),
      now(),
      id
    )
    .run();
  return true;
}
export async function deleteGalleryImage(db: D1Database, id: number) {
  const r = await db.prepare('DELETE FROM gallery_images WHERE id=?').bind(id).run();
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
  const gal = await db.prepare('SELECT COUNT(*) c FROM gallery_images WHERE is_active=1').first<{ c: number }>();
  return {
    products: p,
    inquiries: i,
    categories: cat?.c ?? 0,
    gallery_images: gal?.c ?? 0,
  };
}
