import { Hono } from 'hono';
import type { Env } from '../index';
import { listProducts, getProduct } from '../db';

const productsRoute = new Hono<{ Bindings: Env }>();

// GET /api/products - 获取上架产品列表（公开）
productsRoute.get('/', async (c) => {
  const { limit, offset } = c.req.query();
  const result = await listProducts(c.env.DB, {
    limit: parseInt(limit || '50'),
    offset: parseInt(offset || '0'),
    activeOnly: true,
  });

  // 解析 JSON 字段
  const data = result.data.map((p) => ({
    ...p,
    product_parameters: p.product_parameters ? JSON.parse(p.product_parameters) : {},
    product_tags: p.product_tags ? JSON.parse(p.product_tags) : [],
  }));

  return c.json({ data, total: data.length });
});

// GET /api/products/:id - 获取单个产品详情
productsRoute.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const product = await getProduct(c.env.DB, id);

  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }

  return c.json({
    data: {
      ...product,
      product_parameters: product.product_parameters ? JSON.parse(product.product_parameters) : {},
      product_tags: product.product_tags ? JSON.parse(product.product_tags) : [],
    },
  });
});

export { productsRoute };
