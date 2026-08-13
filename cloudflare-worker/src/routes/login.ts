import { Hono } from 'hono';
import type { Env } from '../index';

const loginRoute = new Hono<{ Bindings: Env }>();

// POST /api/admin/login - 管理员登录
loginRoute.post('/login', async (c) => {
  const { username, password } = await c.req.json();

  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }

  const env = c.env as Env;
  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 生成 token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

  // 存储到 KV
  await env.KV.put(
    `session:${token}`,
    JSON.stringify({
      username,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    }),
    { expirationTtl: 86400 } // 24小时（秒）
  );

  return c.json({
    data: {
      token,
      expiresIn: 86400,
      username,
    },
    message: 'Login successful',
  });
});

// POST /api/admin/logout - 登出
loginRoute.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await c.env.KV.delete(`session:${token}`);
  }
  return c.json({ message: 'Logged out' });
});

export { loginRoute };
