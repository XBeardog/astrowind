# AstroWind 管理端

基于 Cloudflare 免费服务的工厂独立站管理后台。

## 架构

| 组件 | 技术 | 用途 |
|------|------|------|
| 后端 | Cloudflare Workers + Hono | API 服务 |
| 数据库 | Cloudflare D1 | 产品数据存储 |
| 存储 | Cloudflare R2 | 图片文件存储 |
| 认证 | Cloudflare KV | 管理员会话存储 |
| 前端 | 纯 HTML/JS (Tailwind CDN) | 管理后台界面 |

## 项目结构

```
cloudflare-worker/     # 后端 API
admin-panel/           # 前端管理界面
```

---

## 后端部署 (Cloudflare Worker)

### 1. 安装依赖

```bash
cd cloudflare-worker
npm install
```

### 2. 创建 D1 数据库

```bash
# 在 Cloudflare Dashboard 创建 D1 数据库，获取 database_id
# 然后在 wrangler.toml 中替换 YOUR_DATABASE_ID

# 初始化 schema
wrangler d1 execute astrowind-db --file=./schema.sql
```

### 3. 创建 R2 Bucket

```bash
# 在 Cloudflare Dashboard 创建 R2 bucket，命名为 astrowind-images
# 绑定自定义域名后，文件可通过 https://pub-xxx.r2.dev/filename 访问
```

### 4. 创建 KV Namespace

```bash
# 在 Cloudflare Dashboard 创建 KV namespace，获取 namespace_id
# 替换 wrangler.toml 中的 YOUR_KV_NAMESPACE_ID
```

### 5. 设置管理员密码

```bash
wrangler secret put ADMIN_PASSWORD
# 输入管理员密码
```

### 6. 部署

```bash
wrangler deploy
```

部署成功后，Worker URL 格式为：`https://astrowind-worker.<你的账号>.workers.dev`

---

## 前端部署 (Cloudflare Pages)

### 1. 直接部署

```bash
cd admin-panel
# 在 Cloudflare Dashboard → Pages → Create project
# 直接上传 admin-panel 文件夹
# 或连接 GitHub 仓库自动部署
```

### 2. 配置 API 地址

编辑 `admin-panel/js/api.js`，将 `API_BASE` 改为你的 Worker 地址：

```javascript
const CONFIG = {
  API_BASE: 'https://astrowind-worker.<你的账号>.workers.dev',
};
```

或者在本地开发时留空（同源模式）。

### 3. CORS 配置

Worker 的 `wrangler.toml` 中 CORS origin 已预设：
- `http://localhost:5173` - 本地开发
- `https://astrowind.pages.dev` - Pages 部署

如需自定义域名，更新 `src/index.ts` 中的 CORS 配置。

---

## API 接口

### 公开接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/products` | 获取上架产品列表 |
| GET | `/api/products/:id` | 获取单个产品详情 |

### 管理端接口（需 Bearer Token）

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/admin/login` | 登录（返回 token） |
| POST | `/api/admin/logout` | 登出 |
| GET | `/api/admin/products` | 获取所有产品（含下架） |
| POST | `/api/admin/products` | 新增产品 |
| GET | `/api/admin/products/:id` | 获取单个产品 |
| PUT | `/api/admin/products/:id` | 更新产品 |
| DELETE | `/api/admin/products/:id` | 删除产品 |
| PATCH | `/api/admin/products/:id/toggle` | 切换上下架 |
| GET | `/api/admin/stats` | 产品统计 |
| POST | `/api/admin/upload` | 上传图片到 R2 |

---

## 本地开发

### Worker 本地调试

```bash
cd cloudflare-worker
npm run dev
# API 运行在 http://localhost:8787
```

### 前端本地调试

由于前端是静态文件，可以直接用浏览器打开 `admin-panel/index.html`，或用任意静态服务器：

```bash
# 方式一：Python
cd admin-panel
python -m http.server 5173

# 方式二：Node.js
npx serve admin-panel -p 5173
```

---

## 免费额度说明

- **Workers**: 每天 10万 请求，CPU 时间 10ms/请求
- **D1**: 500 万行存储，500 万次读取/天
- **R2**: 10GB 存储，100 万次操作/天
- **KV**: 1GB 存储，100 万次读取/天

对于工厂独立站管理端来说，免费额度完全够用。
