// 配置
const CONFIG = {
  // 后端 API 地址
  API_BASE: window.location.hostname === 'localhost' 
    ? 'http://localhost:8787' 
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

    // 添加认证 token
    const token = Auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      Auth.logout();
      window.location.href = 'index.html';
      return;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  // 产品相关
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

  // 统计
  stats: () => API.request('/api/admin/stats'),

  // 登录/登出
  login: (username, password) =>
    API.request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => API.request('/api/admin/logout', { method: 'POST' }).catch(() => {}),

  // 上传
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
};
