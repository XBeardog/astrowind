import { Hono } from 'hono';
import type { Env } from '../index';
import type {
  ProductForm, CategoryForm, BannerForm, GalleryImageForm, InquiryReplyForm,
} from '../types';
import {
  // 产品
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProductActive,
  // 分类
  listCategories, getCategory, createCategory, updateCategory, deleteCategory,
  // Banner
  listBanners, getBanner, createBanner, updateBanner, deleteBanner,
  // 相册
  listGallery, getGalleryImage, createGalleryImage, updateGalleryImage, deleteGalleryImage,
  // 询盘
  listInquiries, getInquiry, replyInquiry, deleteInquiry,
  // 统计
  statsAll,
} from '../db';

const adminRoute = new Hono<{ Bindings: Env }>();
const parseJSON = (s?: string | null) => (s ? JSON.parse(s) : null);

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
// Banner 管理
// ============================================================
adminRoute.get('/banners', async (c) => {
  const list = await listBanners(c.env.DB);
  return c.json({ data: list });
});
adminRoute.get('/banners/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const e = await getBanner(c.env.DB, id);
  if (!e) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: e });
});
adminRoute.post('/banners', async (c) => {
  const form = (await c.req.json()) as BannerForm;
  if (!form.image_url) return c.json({ error: 'image_url 必填' }, 400);
  const id = await createBanner(c.env.DB, form);
  return c.json({ data: { id, ...form }, message: 'Banner created' }, 201);
});
adminRoute.put('/banners/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as BannerForm;
  const ok = await updateBanner(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Banner updated' });
});
adminRoute.delete('/banners/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteBanner(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Banner deleted' });
});

// ============================================================
// 工厂相册管理
// ============================================================
adminRoute.get('/gallery', async (c) => {
  const { category } = c.req.query();
  const list = await listGallery(c.env.DB, { category });
  return c.json({ data: list });
});
adminRoute.get('/gallery/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const e = await getGalleryImage(c.env.DB, id);
  if (!e) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: e });
});
adminRoute.post('/gallery', async (c) => {
  const form = (await c.req.json()) as GalleryImageForm;
  if (!form.image_url) return c.json({ error: 'image_url 必填' }, 400);
  const id = await createGalleryImage(c.env.DB, form);
  return c.json({ data: { id, ...form }, message: 'Gallery image created' }, 201);
});
adminRoute.put('/gallery/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as GalleryImageForm;
  const ok = await updateGalleryImage(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Gallery image updated' });
});
adminRoute.delete('/gallery/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteGalleryImage(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ message: 'Gallery image deleted' });
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
