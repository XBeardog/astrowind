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

    // 构造公网访问 URL
    const publicUrl = c.env.R2_PUBLIC_URL || `https://pub-${c.env.R2_ACCOUNT_ID}.r2.dev`;
    const url = `${publicUrl}/${fileName}`;

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
