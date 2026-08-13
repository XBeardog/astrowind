# TODO: 数据库设计与管理端规划

## 📅 创建日期
2026-08-11

## 🎯 目标
将产品中心从静态硬编码改为数据库驱动的动态表单，支持通过管理端进行产品的增删改查。

---

## 📊 数据库设计

### 产品表 (products) - D1
| 字段名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| id | INTEGER PRIMARY KEY | 主键自增 | 1 |
| image_url | TEXT NOT NULL | 产品图片URL（存储在 Cloudflare R2） | https://cdn.r2.cloudfl.com/product/001.jpg |
| product_name | TEXT NOT NULL | 产品名称 | 精密结构件模具 |
| product_description | TEXT | 产品叙述/描述 | 精密结构件与紧固件模具，尺寸精准、强度可靠... |
| product_parameters | TEXT | 产品参数（JSON格式存储） | {"material":"POM","size":"100x50mm","weight":"50g"} |
| product_tags | TEXT | 产品标签（逗号分隔或JSON数组） | ["结构件","紧固件","精密"] |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 创建时间 | 2026-08-11T10:00:00Z |
| updated_at | TIMESTAMP | 更新时间 | 2026-08-11T10:00:00Z |
| sort_order | INTEGER DEFAULT 0 | 排序权重（越小越靠前） | 1 |
| is_active | INTEGER DEFAULT 1 | 是否上架（1=上架，0=下架） | 1 |

### 产品参数 JSON 结构示例
```json
{
  "material": "POM",
  "hardness": "HRC 28-32",
  "cavity": "1x2",
  "cycle_time": "15s",
  "product_size": "100x50x20mm",
  "product_weight": "50g",
  "tolerance": "±0.05mm",
  "surface_finish": "Ra 1.6"
}
```

### 产品标签建议值
- 结构件、紧固件、包胶、潮玩、玩具、大型壳体
- 工业、电子、家电、汽车、医疗
- 精密、高透光、耐高温、高强度

---

## 🛠 管理端功能需求

### 基础功能
- [x] **登录认证** - 使用 Cloudflare KV 存储管理员账号密码
- [ ] **仪表盘页面** - 产品数量统计、最近更新时间
- [ ] **产品列表页** - 表格形式展示所有产品，支持搜索、筛选
- [ ] **新增产品表单** - 包含5个字段的录入界面
- [ ] **编辑产品表单** - 修改已有产品信息
- [ ] **删除产品** - 支持批量删除和单个删除
- [ ] **图片上传** - 将图片上传到 Cloudflare R2 对象存储
- [ ] **产品排序** - 通过拖拽或权重值调整显示顺序
- [ ] **上架/下架** - 切换产品显示状态

### 表单字段详情
1. **产品图片**（必填）
   - 支持本地上传或填写URL
   - 上传后自动存储到 R2 并返回 CDN URL
   - 推荐尺寸：800x600px，最大 5MB

2. **产品名称**（必填）
   - 文本输入框
   - 最大长度：100字符

3. **产品叙述**（必填）
   - 多行文本编辑器
   - 支持 Markdown 格式
   - 最大长度：1000字符

4. **产品参数**
   - JSON 编辑器或表单化字段
   - 支持添加/删除参数项
   - key-value 格式

5. **产品标签**
   - 标签输入框（类似 GitHub issue 标签）
   - 支持自定义标签
   - 支持从预设标签库选择

---

## 🔌 API 接口设计

### Cloudflare Worker 后端
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| GET | /api/admin/products | 获取产品列表（支持分页） |
| POST | /api/admin/products | 新增产品 |
| PUT | /api/admin/products/:id | 更新产品 |
| DELETE | /api/admin/products/:id | 删除产品 |
| POST | /api/admin/upload | 上传图片到 R2 |

### 公开接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/products | 获取上架产品列表 |
| GET | /api/products/:id | 获取单个产品详情 |

---

## 🌐 前端展示需求

### 产品中心页面 (products.astro)
- [ ] **动态加载产品** - 从 API 获取产品列表
- [ ] **卡片网格布局** - 响应式显示产品卡片（3列/2列/1列）
- [ ] **标签筛选** - 根据标签进行产品筛选
- [ ] **产品详情弹窗** - 点击卡片展示完整信息

### 首页产品预览
- [ ] 动态获取最新/推荐产品
- [ ] 简化为通用展示区块（已完成）

---

## 📁 项目结构建议

```
cloudflare-worker/
├── src/
│   ├── index.ts          # Worker 入口
│   ├── routes/
│   │   ├── admin.ts      # 管理端路由
│   │   ├── products.ts   # 产品公开接口
│   │   └── upload.ts     # 图片上传
│   ├── db.ts             # D1 数据库操作
│   ├── storage.ts        # R2 存储操作
│   └── auth.ts           # 认证中间件
└── wrangler.toml

admin-panel/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductEditor.tsx
│   ├── components/
│   │   ├── ImageUploader.tsx
│   │   ├── TagInput.tsx
│   │   └── ParameterEditor.tsx
│   └── api.ts
└── package.json
```

---

## ✅ 已完成

- [x] 移除首页等页面中写死的4个产品分类展示
- [x] 简化 footer 中产品中心的固定链接
- [x] 创建 TODO.md 规划文档
- [x] 创建 Cloudflare Worker 后端项目（cloudflare-worker）
- [x] 设计 D1 数据库表结构并创建 schema.sql
- [x] 实现产品 CRUD API（公开+管理端）
- [x] 实现图片上传到 R2
- [x] 实现登录认证（KV存储会话）
- [x] 创建管理前端项目（admin-panel）
- [x] 实现登录认证页面
- [x] 实现仪表盘页面（统计）
- [x] 实现产品列表页（搜索/上下架/删除）
- [x] 实现产品新增/编辑表单（含图片上传、参数、标签）

## 📋 后续任务

1. **Phase 3: 前端集成**
   - [ ] 改造 products.astro 页面为动态加载
   - [ ] 添加标签筛选功能
   - [ ] 添加产品详情弹窗

2. **Phase 4: 部署与测试**
   - [ ] 部署 Worker 到 Cloudflare
   - [ ] 初始化 D1 数据库
   - [ ] 创建 R2 Bucket 并绑定自定义域名
   - [ ] 创建 KV Namespace 并配置 secret
   - [ ] 部署管理端到 Pages
   - [ ] 测试完整流程
   - [ ] 性能优化

---

## 🔗 相关文档

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
