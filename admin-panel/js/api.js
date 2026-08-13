// 配置
const CONFIG = {
  // 后端 API 地址
  API_BASE:
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:8787'
      : 'https://astrowind-worker.1900692808.workers.dev',
};

// API 请求封装
const API = {
  async request(endpoint, options = {}) {
    const url = CONFIG.API_BASE + endpoint;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      Auth.logout();
      window.location.href = 'index.html';
      return;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  // -------------------- 身份 --------------------
  login: (username, password) =>
    API.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => API.request('/api/admin/logout', { method: 'POST' }).catch(() => {}),

  // -------------------- 统计 --------------------
  stats: () => API.request('/api/admin/stats'),

  // -------------------- 产品 --------------------
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/admin/products${query ? '?' + query : ''}`);
    },
    get: (id) => API.request(`/api/admin/products/${id}`),
    create: (data) => API.request('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/api/admin/products/${id}`, { method: 'DELETE' }),
    toggle: (id) => API.request(`/api/admin/products/${id}/toggle`, { method: 'PATCH' }),
  },

  // -------------------- 分类 --------------------
  categories: {
    list: () => API.request('/api/admin/categories'),
    get: (id) => API.request(`/api/admin/categories/${id}`),
    create: (data) => API.request('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/api/admin/categories/${id}`, { method: 'DELETE' }),
  },

  // -------------------- Banner --------------------
  banners: {
    list: () => API.request('/api/admin/banners'),
    get: (id) => API.request(`/api/admin/banners/${id}`),
    create: (data) => API.request('/api/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/api/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/api/admin/banners/${id}`, { method: 'DELETE' }),
  },

  // -------------------- 工厂相册 --------------------
  gallery: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/admin/gallery${query ? '?' + query : ''}`);
    },
    get: (id) => API.request(`/api/admin/gallery/${id}`),
    create: (data) => API.request('/api/admin/gallery', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.request(`/api/admin/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/api/admin/gallery/${id}`, { method: 'DELETE' }),
  },

  // -------------------- 询盘 --------------------
  inquiries: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/admin/inquiries${query ? '?' + query : ''}`);
    },
    get: (id) => API.request(`/api/admin/inquiries/${id}`),
    reply: (id, data) => API.request(`/api/admin/inquiries/${id}/reply`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.request(`/api/admin/inquiries/${id}`, { method: 'DELETE' }),
  },

  // -------------------- 上传图片 --------------------
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = CONFIG.API_BASE + '/api/admin/upload';
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }
    return response.json();
  },

  // -------------------- 公开接口（主站用，管理端也可调用测试） --------------------
  public: {
    products: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/products${query ? '?' + query : ''}`);
    },
    product: (id) => API.request(`/api/products/${id}`),
    categories: () => API.request('/api/products/categories/list'),
    banners: (lang) =>
      API.request('/api/products/banners/list' + (lang ? `?lang=${lang}` : '')),
    gallery: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/api/products/gallery/list${query ? '?' + query : ''}`);
    },
    submitInquiry: (data) =>
      API.request('/api/products/inquiries/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    health: () => fetch(CONFIG.API_BASE + '/api/health').then((r) => r.json()),
  },
};
