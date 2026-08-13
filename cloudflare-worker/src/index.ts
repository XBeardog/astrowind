import { Hono } from 'hono';
import cors from './cors';
import { productsRoute } from './routes/products';
import { adminRoute } from './routes/admin';
import { uploadRoute } from './routes/upload';
import { loginRoute } from './routes/login';
import { auth } from './auth';

export type Env = {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  R2_ACCOUNT_ID: string;
  R2_PUBLIC_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

app.route('*', cors);

// 公开接口（不需要认证）
app.route('/api/products', productsRoute);       // 产品/分类/Banner/相册/询盘提交
app.route('/api/admin', loginRoute);            // /login /logout（注意只处理这两个路径，不挂其他 admin 路由）

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 管理端接口（需要认证）
app.use('/api/admin/*', auth);
app.route('/api/admin', adminRoute);            // /api/admin/products, /categories, /banners, /gallery, /inquiries, /stats
app.route('/api/admin/upload', uploadRoute);    // /api/admin/upload

// 404
app.notFound((c) => c.json({ error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
