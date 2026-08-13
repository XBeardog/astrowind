import { Hono } from 'hono';
import type { Env } from '../index';
import {
  listProducts, getProduct, listCategories, listBanners, listGallery, createInquiry,
} from '../db';
import type { Category, InquiryForm, Product } from '../types';

const productsRoute = new Hono<{ Bindings: Env }>();

/**
 * 把 DB Product (带 product_* 列名 + JSON 字符串 tags/specs)
 * 转成「对外视图」：
 * - 保留 product_*（管理端依赖）
 * - 补 name / description / tags(数组) / specs(对象) / category_name（主站依赖）
 */
function publicProductView(p: Product & { category_name?: string }, catMap?: Record<number, Category>): any {
  const tagsRaw: any = (p as any).product_tags;
  const specsRaw: any = (p as any).product_parameters;
  let tags: string[] = [];
  let specs: Record<string, any> = {};
  try { if (typeof tagsRaw === 'string') tags = JSON.parse(tagsRaw); else if (Array.isArray(tagsRaw)) tags = tagsRaw; } catch {}
  try { if (typeof specsRaw === 'string') specs = JSON.parse(specsRaw); else if (specsRaw && typeof specsRaw === 'object') specs = specsRaw; } catch {}
  if (!Array.isArray(tags)) tags = [];
  if (!specs || typeof specs !== 'object') specs = {};

  // category_name：优先 SELECT 带出的，否则用 catMap 查
  let categoryName = (p as any).category_name;
  if (!categoryName && p.category_id && catMap) categoryName = catMap[p.category_id]?.name;

  return {
    id: p.id,
    category_id: p.category_id ?? null,
    category_name: categoryName || null,
    image_url: p.image_url,

    // 主站友好字段名
    name: (p as any).product_name || '',
    description: (p as any).product_description || '',
    tags,
    specs,

    // 兼容管理端（product-form / products.html）
    product_name: (p as any).product_name || '',
    product_description: (p as any).product_description || '',
    product_parameters: specs,
    product_tags: tags,

    sort_order: p.sort_order ?? 0,
    is_active: p.is_active ?? 1,
    created_at: (p as any).created_at,
    updated_at: (p as any).updated_at,
  };
}

async function loadCatMap(db: any): Promise<Record<number, Category>> {
  const list: Category[] = await listCategories(db, { activeOnly: true });
  const m: Record<number, Category> = {};
  for (const c of list) if (c.id) m[c.id] = c;
  return m;
}

// ---------- 产品（公开）----------
productsRoute.get('/list', async (c) => {
  const { limit, offset, category_id, category, keyword, active_only, search } = c.req.query();
  const useActiveOnly = active_only === '1' || active_only === 'true';
  const catId = category_id || category;
  const result = await listProducts(c.env.DB, {
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
    activeOnly: useActiveOnly,
    categoryId: catId ? parseInt(catId) : undefined,
    search: keyword || search,
  });
  const catMap = await loadCatMap(c.env.DB);
  const data = result.data.map((p) => publicProductView(p as any, catMap));
  return c.json({ data, total: result.total });
});

// 兼容：/api/products (旧路径, 管理端 products.html 会请求到这里？查看 admin API —— 管理端是 /api/admin/products 所以这条对外是给前端)
productsRoute.get('/', async (c) => {
  // 转到 /list 的相同逻辑（为了历史兼容）
  const { limit, offset, category_id, category, keyword, active_only, search } = c.req.query();
  const useActiveOnly = active_only === '1' || active_only === 'true' || !(active_only === '0' || active_only === 'false');
  const catId = category_id || category;
  const result = await listProducts(c.env.DB, {
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
    activeOnly: useActiveOnly,
    categoryId: catId ? parseInt(catId) : undefined,
    search: keyword || search,
  });
  const catMap = await loadCatMap(c.env.DB);
  const data = result.data.map((p) => publicProductView(p as any, catMap));
  return c.json({ data, total: result.total });
});

productsRoute.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const p = await getProduct(c.env.DB, id);
  if (!p) return c.json({ error: 'Product not found' }, 404);
  const catMap = await loadCatMap(c.env.DB);
  return c.json({ data: publicProductView(p as any, catMap) });
});

// ---------- 分类（公开）----------
productsRoute.get('/categories/list', async (c) => {
  const list = await listCategories(c.env.DB, { activeOnly: true });
  return c.json({ data: list });
});

// ---------- Banner（公开）----------
productsRoute.get('/banners/list', async (c) => {
  const { lang } = c.req.query();
  const list = await listBanners(c.env.DB, { activeOnly: true, lang });
  return c.json({ data: list });
});

// ---------- 工厂相册（公开）----------
productsRoute.get('/gallery/list', async (c) => {
  const { category, limit, active_only } = c.req.query();
  const list = await listGallery(c.env.DB, {
    activeOnly: active_only === undefined ? true : active_only === '1' || active_only === 'true',
    category,
    limit: limit ? parseInt(limit) : undefined,
  });
  return c.json({ data: list });
});

// ---------- 提交询盘（公开，带反垃圾简单校验）----------
productsRoute.post('/inquiries/submit', async (c) => {
  const form = (await c.req.json()) as InquiryForm;
  if (!form.name || !form.name.trim()) {
    return c.json({ error: '姓名必填' }, 400);
  }
  if ((!form.email || !form.email.trim()) && (!form.phone || !form.phone.trim())) {
    return c.json({ error: '邮箱或电话至少填一项' }, 400);
  }
  const trimmed: InquiryForm = {
    name: form.name.trim(),
    company: form.company?.trim() || undefined,
    email: form.email?.trim() || undefined,
    phone: form.phone?.trim() || undefined,
    country: form.country?.trim() || undefined,
    product_id: form.product_id || undefined,
    message: form.message?.trim() || undefined,
  };
  if (trimmed.message && trimmed.message.length > 5000) {
    return c.json({ error: '留言内容过长' }, 400);
  }
  const id = await createInquiry(c.env.DB, trimmed);
  return c.json({ data: { id }, message: 'Inquiry submitted' }, 201);
});

export { productsRoute };
