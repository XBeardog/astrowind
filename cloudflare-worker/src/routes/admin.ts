import { Hono } from 'hono';
import type { Env } from '../index';
import type {
  ProductForm, CategoryForm, MomentForm, InquiryReplyForm,
} from '../types';
import {
  // 产品
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProductActive,
  toggleProductCarousel,
  // 分类
  listCategories, getCategory, createCategory, updateCategory, deleteCategory,
  // 工厂实拍动态
  listMoments, getMoment, createMoment, updateMoment, deleteMoment,
  // 询盘
  listInquiries, getInquiry, replyInquiry, deleteInquiry,
  // 统计
  statsAll,
} from '../db';

const adminRoute = new Hono<{ Bindings: Env }>();
const parseJSON = (s?: string | null) => (s ? JSON.parse(s) : null);

// 把 images（JSON 字符串）转成数组对外输出
const parseImages = (s: any): string[] => {
  try {
    const v = typeof s === 'string' ? JSON.parse(s) : s;
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : [];
  } catch {
    return [];
  }
};
const momentView = (m: any) => ({ ...m, images: parseImages(m.images) });

// ============================================================
// 统计
// ============================================================
adminRoute.get('/stats', async (c) => {
  const d = await statsAll(c.env.DB);
  return c.json({ data: d });
});

// ============================================================
// 产品管理
// ============================================================
adminRoute.get('/products', async (c) => {
  const { limit, offset, category, search } = c.req.query();
  const { data, total } = await listProducts(c.env.DB, {
    limit: parseInt(limit || '100'),
    offset: parseInt(offset || '0'),
    activeOnly: false,
    categoryId: category ? parseInt(category) : undefined,
    search,
  });
  const list = data.map((p) => ({
    ...p,
    product_parameters: parseJSON(p.product_parameters) ?? {},
    product_tags: parseJSON(p.product_tags) ?? [],
  }));
  return c.json({ data: list, total });
});
adminRoute.get('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const p = await getProduct(c.env.DB, id);
  if (!p) return c.json({ error: 'Not found' }, 404);
  return c.json({
    data: {
      ...p,
      product_parameters: parseJSON(p.product_parameters) ?? {},
      product_tags: parseJSON(p.product_tags) ?? [],
    },
  });
});
adminRoute.post('/products', async (c) => {
  const form = (await c.req.json()) as ProductForm;
  if (!form.image_url || !form.product_name) {
    return c.json({ error: 'image_url, product_name 必填' }, 400);
  }
  const id = await createProduct(c.env.DB, form);
  return c.json({ data: { id, ...form }, message: 'Product created' }, 201);
});
adminRoute.put('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as ProductForm;
  const ok = await updateProduct(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Product updated' });
});
adminRoute.delete('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteProduct(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Product deleted' });
});
adminRoute.patch('/products/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await toggleProductActive(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Status toggled' });
});
adminRoute.patch('/products/:id/carousel', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await toggleProductCarousel(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Carousel flag toggled' });
});

// ============================================================
// 分类管理
// ============================================================
adminRoute.get('/categories', async (c) => {
  const list = await listCategories(c.env.DB);
  return c.json({ data: list });
});
adminRoute.get('/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const e = await getCategory(c.env.DB, id);
  if (!e) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: e });
});
adminRoute.post('/categories', async (c) => {
  const form = (await c.req.json()) as CategoryForm;
  if (!form.name) return c.json({ error: 'name 必填' }, 400);
  const id = await createCategory(c.env.DB, form);
  return c.json({ data: { id, ...form }, message: 'Category created' }, 201);
});
adminRoute.put('/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as CategoryForm;
  const ok = await updateCategory(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Category updated' });
});
adminRoute.delete('/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteCategory(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Category deleted' });
});

// ============================================================
// 工厂实拍管理（朋友圈式动态，最新在前）
// ============================================================
adminRoute.get('/moments', async (c) => {
  const list = await listMoments(c.env.DB);
  return c.json({ data: list.map(momentView) });
});
adminRoute.get('/moments/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const e = await getMoment(c.env.DB, id);
  if (!e) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: momentView(e) });
});
adminRoute.post('/moments', async (c) => {
  const form = (await c.req.json()) as MomentForm;
  const content = (form.content || '').trim();
  const images = Array.isArray(form.images) ? form.images.filter(Boolean) : [];
  if (!content && !images.length) {
    return c.json({ error: '文案和图片至少填一项' }, 400);
  }
  const id = await createMoment(c.env.DB, { ...form, content, images });
  return c.json({ data: { id, ...form, content, images }, message: 'Moment created' }, 201);
});
adminRoute.put('/moments/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as MomentForm;
  const ok = await updateMoment(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Moment updated' });
});
adminRoute.delete('/moments/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteMoment(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Moment deleted' });
});

// ============================================================
// 询盘管理
// ============================================================
adminRoute.get('/inquiries', async (c) => {
  const { status, limit, offset } = c.req.query();
  const { data, total } = await listInquiries(c.env.DB, {
    status,
    limit: parseInt(limit || '50'),
    offset: parseInt(offset || '0'),
  });
  return c.json({ data, total });
});
adminRoute.get('/inquiries/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const e = await getInquiry(c.env.DB, id);
  if (!e) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: e });
});
adminRoute.put('/inquiries/:id/reply', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as InquiryReplyForm;
  const ok = await replyInquiry(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Reply saved' });
});
adminRoute.delete('/inquiries/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteInquiry(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Inquiry deleted' });
});

export { adminRoute };
