import { Hono } from 'hono';
import type { Env } from '../index';

const uploadRoute = new Hono<{ Bindings: Env }>();

// POST /api/admin/upload - 上传图片到 R2
uploadRoute.post('/', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG' }, 400);
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File too large. Max 5MB allowed' }, 400);
    }

    // 生成唯一文件名
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 构造可访问的图片 URL：走 Worker 自身的 /api/images（同源 /api 代理）
    // - 本地直连 Worker：使用请求自身的 origin（如 http://127.0.0.1:8787）
    // - 线上经 Pages Function 代理：代理会带上 X-Public-Origin，保证返回站点域名而非 workers.dev
    const origin = c.req.header('X-Public-Origin') || new URL(c.req.url).origin;
    const url = `${origin.replace(/\/$/, '')}/api/images/${fileName}`;

    return c.json({
      data: {
        url,
        fileName,
        size: file.size,
        type: file.type,
      },
      message: 'Upload successful',
    });
  } catch (err) {
    console.error('Upload error:', err);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// DELETE /api/admin/upload/:fileName - 删除文件
uploadRoute.delete('/:fileName', async (c) => {
  const fileName = c.req.param('fileName');
  try {
    await c.env.R2.delete(fileName);
    return c.json({ message: 'File deleted' });
  } catch {
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export { uploadRoute };
