import { Hono } from 'hono';
import type { Env } from '../index';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleProductActive, countProducts } from '../db';
import type { ProductForm } from '../types';

const adminRoute = new Hono<{ Bindings: Env }>();

// GET /api/admin/products - 获取所有产品（包括下架）
adminRoute.get('/products', async (c) => {
  const { limit, offset, search } = c.req.query();
  const result = await listProducts(c.env.DB, {
    limit: parseInt(limit || '100'),
    offset: parseInt(offset || '0'),
    activeOnly: false,
  });

  let data = result.data.map((p) => ({
    ...p,
    product_parameters: p.product_parameters ? JSON.parse(p.product_parameters) : {},
    product_tags: p.product_tags ? JSON.parse(p.product_tags) : [],
  }));

  // 简单搜索
  if (search) {
    const q = search.toLowerCase();
    data = data.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.product_description && p.product_description.toLowerCase().includes(q)) ||
        (p.product_tags && Array.isArray(p.product_tags) && p.product_tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  }

  return c.json({ data, total: data.length });
});

// GET /api/admin/products/:id
adminRoute.get('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const product = await getProduct(c.env.DB, id);
  if (!product) return c.json({ error: 'Not found' }, 404);

  return c.json({
    data: {
      ...product,
      product_parameters: product.product_parameters ? JSON.parse(product.product_parameters) : {},
      product_tags: product.product_tags ? JSON.parse(product.product_tags) : [],
    },
  });
});

// POST /api/admin/products - 新增产品
adminRoute.post('/products', async (c) => {
  const form = (await c.req.json()) as ProductForm;

  if (!form.image_url || !form.product_name) {
    return c.json({ error: 'Missing required fields: image_url, product_name' }, 400);
  }

  const id = await createProduct(c.env.DB, form);
  return c.json({ data: { id, ...form }, message: 'Product created' }, 201);
});

// PUT /api/admin/products/:id - 更新产品
adminRoute.put('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const form = (await c.req.json()) as ProductForm;

  const ok = await updateProduct(c.env.DB, id, form);
  if (!ok) return c.json({ error: 'Not found' }, 404);

  return c.json({ message: 'Product updated' });
});

// DELETE /api/admin/products/:id - 删除产品
adminRoute.delete('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await deleteProduct(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);

  return c.json({ message: 'Product deleted' });
});

// PATCH /api/admin/products/:id/toggle - 上下架切换
adminRoute.patch('/products/:id/toggle', async (c) => {
  const id = parseInt(c.req.param('id'));
  const ok = await toggleProductActive(c.env.DB, id);
  if (!ok) return c.json({ error: 'Not found' }, 404);

  return c.json({ message: 'Status toggled' });
});

// GET /api/admin/stats - 统计数据
adminRoute.get('/stats', async (c) => {
  const counts = await countProducts(c.env.DB);
  return c.json({ data: counts });
});

// POST /api/admin/login - 登录（公开路由，不经过 auth 中间件）
// 注意：这个路由挂载在 /api/admin 下，但我们在 index.ts 里对 /api/admin/* 使用了 auth
// 所以需要单独处理 login 的路径，实际上 login 应该在 auth 中间件之前
// 这里的 login 路由不会被使用，见下方单独处理
// 为避免混淆，这里不定义 login

export { adminRoute };
