import { Hono } from 'hono';
import type { Env } from '../index';

const imagesRoute = new Hono<{ Bindings: Env }>();

// GET /api/images/:fileName - 从 R2 读取图片并直接返回
// 不依赖 r2.dev 公网域名（需单独开启，且国内访问不稳定），
// 前端通过同源 /api/images/xxx 访问即可。
imagesRoute.get('/:fileName', async (c) => {
  const fileName = c.req.param('fileName');

  const object = await c.env.R2.get(fileName);
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
});

export { imagesRoute };
