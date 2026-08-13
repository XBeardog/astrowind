-- D1 数据库 Schema
-- 说明：管理员会话使用 KV 存储（不使用 admin_sessions 表），登录登出见 login.ts

-- ============================================================
-- 1. 产品
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  image_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_parameters TEXT,   -- JSON 对象：{"材质":"ABS","尺寸":"100mm"}
  product_tags TEXT,         -- JSON 数组：["汽车配件","精密"]
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort   ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_cat    ON products(category_id);

-- ============================================================
-- 2. 产品分类
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  slug TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- ============================================================
-- 3. 首页 Banner / 轮播图
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  lang TEXT DEFAULT 'zh',          -- zh | en | all
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_lang   ON banners(lang);

-- ============================================================
-- 4. 工厂实拍 / 相册
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'factory',   -- factory | equipment | product-show | team
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_gallery_active   ON gallery_images(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_images(category);

-- ============================================================
-- 5. 询盘 / 联系留言（用户从前端提交）
-- ============================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  product_id INTEGER,
  message TEXT,
  status TEXT DEFAULT 'new',         -- new | replied | closed
  created_at TEXT DEFAULT (datetime('now')),
  replied_at TEXT,
  reply_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_date   ON inquiries(created_at);
