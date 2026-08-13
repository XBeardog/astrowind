import { Hono } from 'hono';
import { cors } from 'hono/cors';
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

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:8788', 'https://astrowind.pages.dev', 'https://astrowind-admin.pages.dev'],
  credentials: true,
}));

// 公开接口 - 无需认证
app.route('/api/products', productsRoute);
app.route('/api/admin', loginRoute);  // login/logout 不需要认证

// 管理端接口 - 需要认证
app.use('/api/admin/*', auth);
app.route('/api/admin', adminRoute);
app.route('/api/admin/upload', uploadRoute);

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default app;
