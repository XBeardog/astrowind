import { createMiddleware } from 'hono/factory';
import type { Env } from './index';

export const auth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - Missing token' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // 从 KV 验证 token
    const session = await c.env.KV.get(`session:${token}`);
    if (!session) {
      return c.json({ error: 'Unauthorized - Invalid or expired token' }, 401);
    }

    const sessionData = JSON.parse(session);
    // 检查是否过期
    if (new Date(sessionData.expiresAt) < new Date()) {
      await c.env.KV.delete(`session:${token}`);
      return c.json({ error: 'Unauthorized - Token expired' }, 401);
    }

    // 将用户信息注入上下文
    c.set('user', { username: sessionData.username });
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});
