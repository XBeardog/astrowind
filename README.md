# 工厂独立站 - 项目总览

基于 Cloudflare 免费服务的工厂独立站系统。

## 项目结构

```
factory-site/
├── website/              # 主站前台 (Astro + Tailwind)
├── admin-panel/          # 管理前端 (纯 HTML/JS)
├── cloudflare-worker/    # 后端 API (Hono + D1 + R2 + KV)
└── README.md
```

## 技术栈

| 项目 | 技术 | 部署目标 |
|------|------|---------|
| website | Astro 7 + Tailwind CSS 4 | Cloudflare Pages |
| admin-panel | 原生 HTML/JS + Tailwind CDN | Cloudflare Pages |
| cloudflare-worker | Hono + TypeScript | Cloudflare Workers |
| 数据库 | Cloudflare D1 | Cloudflare D1 |
| 存储 | Cloudflare R2 | Cloudflare R2 |
| 认证 | Cloudflare KV | Cloudflare KV |

## 快速开始

### 本地开发

```bash
# 主站开发
cd website
npm install
npm run dev

# Worker 开发
cd cloudflare-worker
npm install
npm run dev

# 管理端直接打开 admin-panel/index.html
```

## 部署

详细部署说明见各子项目的 README。

### Cloudflare Pages 配置

每个 Pages 项目独立配置：

| 项目 | 构建命令 | 输出目录 |
|------|---------|---------|
| website | `npm run build` | `website/dist` |
| admin-panel | （留空） | `admin-panel` |

### Worker 部署

```bash
cd cloudflare-worker
wrangler deploy
```

## GitHub Actions 自动部署

推送到 main 分支后，Cloudflare Pages 会自动构建对应项目。
