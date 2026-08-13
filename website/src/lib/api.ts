// 前端公开 API 封装（用于主站 Pages 静态站点访问 Worker 后端）
//
// BASE_URL 策略：
// - Astro SSR/构建时：import.meta.env.PUBLIC_API_BASE / localhost 默认用远端 worker
// - 客户端浏览器：优先使用 <body data-api-base>（可由服务端注入），否则走同源推断
//   · dev 默认 http://localhost:8787
//   · 生产（比如 *.pages.dev）默认 https://astrowind-worker.1900692808.workers.dev
//
// 配置技巧（推荐放到 astro.config 或 Pages ENV 里）：
//   PUBLIC_API_BASE=https://astrowind-worker.1900692808.workers.dev

const DEFAULT_REMOTE = 'https://astrowind-worker.1900692808.workers.dev';

function baseFromEnv(): string | undefined {
  // @ts-expect-error: Vite / Astro inject env at runtime
  const v = typeof import.meta !== 'undefined' ? import.meta.env?.PUBLIC_API_BASE : undefined;
  return v || undefined;
}

function baseFromBrowser(): string {
  if (typeof document !== 'undefined') {
    const v = document.body?.getAttribute('data-api-base');
    if (v) return v.replace(/\/$/, '');
    const h = window.location.hostname;
    if (h === '127.0.0.1') return 'http://127.0.0.1:8787';
    if (h === 'localhost') return 'http://localhost:8787';
  }
  return DEFAULT_REMOTE;
}

export const API_BASE: string = (() => {
  const env = baseFromEnv();
  if (env) return env.replace(/\/$/, '');
  // 构建/SSR 阶段：没有 browser，默认 remote
  if (typeof window === 'undefined') return DEFAULT_REMOTE;
  return baseFromBrowser();
})();

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<{ data: T; ok: boolean; error?: string }> {
  const url = API_BASE + path;
  const opts: RequestInit = {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  };
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    const json = text ? safeJSON(text) : {};
    if (!res.ok) {
      return { data: {} as T, ok: false, error: json?.error || `HTTP ${res.status}` };
    }
    return { data: json?.data ?? (json as T), ok: true, error: undefined };
  } catch (e: any) {
    return { data: {} as T, ok: false, error: e?.message || '网络错误' };
  }
}

function safeJSON(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

// ---------- 公开接口（与 Worker /routes/products.ts 对齐） ----------

export interface Product {
  id: number;
  name: string;
  name_en?: string;
  sku?: string;
  category_id?: number;
  category_name?: string;
  price?: number;
  unit?: string;
  description?: string;
  description_en?: string;
  image_url?: string;
  gallery?: string[];
  specs?: any;
  tags?: string[];
  is_active?: 0 | 1;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  name_en?: string;
  slug?: string;
  sort_order?: number;
  is_active?: 0 | 1;
}

export interface Banner {
  id: number;
  image_url: string;
  title?: string;
  subtitle?: string;
  link_url?: string;
  sort_order: number;
  lang?: 'zh' | 'en' | 'all';
  is_active?: 0 | 1;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  category: string; // factory / equipment / product-show / team
  title?: string;
  description?: string;
  sort_order: number;
  is_active?: 0 | 1;
}

export const publicApi = {
  health: () => apiFetch<{ status: string; version?: string }>('/api/health', { method: 'GET' }),

  productsList: (params?: { keyword?: string; category_id?: number; activeOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.keyword) q.set('keyword', params.keyword);
    if (params?.category_id) q.set('category_id', String(params.category_id));
    if (params?.activeOnly !== false) q.set('active_only', '1');
    return apiFetch<Product[]>(`/api/products/list${q.toString() ? '?' + q : ''}`);
  },

  categoriesList: () => apiFetch<Category[]>('/api/products/categories/list'),

  bannersList: (lang?: 'zh' | 'en' | 'all') => {
    const q = lang ? `?lang=${lang}` : '';
    return apiFetch<Banner[]>(`/api/products/banners/list${q}`);
  },

  galleryList: (opts?: { category?: string; activeOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (opts?.category) q.set('category', opts.category);
    if (opts?.activeOnly !== false) q.set('active_only', '1');
    return apiFetch<GalleryImage[]>(`/api/products/gallery/list${q.toString() ? '?' + q : ''}`);
  },

  submitInquiry: (payload: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    country?: string;
    product_id?: number | string;
    message?: string;
    source?: string;
  }) =>
    apiFetch<{ id: number }>('/api/products/inquiries/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
