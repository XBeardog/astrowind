// 公共应用逻辑
const App = {
  // 显示 toast 通知
  toast(message, type = 'success') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-blue-600',
    };
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // 确认对话框
  confirm(message, title = '确认') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-2">${title}</h3>
          <p class="text-gray-600 mb-4">${message}</p>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 rounded-lg border hover:bg-gray-100" data-action="cancel">取消</button>
            <button class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700" data-action="confirm">确认</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('[data-action="cancel"]').onclick = () => {
        modal.remove();
        resolve(false);
      };
      modal.querySelector('[data-action="confirm"]').onclick = () => {
        modal.remove();
        resolve(true);
      };
    });
  },

  // 加载骨架屏
  loading(el, show = true) {
    if (show) {
      el.innerHTML = '<div class="animate-pulse space-y-2"><div class="h-4 bg-gray-200 rounded w-3/4"></div><div class="h-4 bg-gray-200 rounded w-1/2"></div></div>';
    }
  },

  // 初始化布局（侧边栏/导航）
  initLayout(activePage) {
    const username = Auth.getUser();
    const layout = document.createElement('div');
    layout.className = 'flex h-screen bg-gray-50';
    layout.innerHTML = `
      <!-- 侧边栏 -->
      <aside class="w-64 bg-gray-900 text-white flex flex-col">
        <div class="p-4 border-b border-gray-800">
          <h1 class="text-xl font-bold">🛠 工厂管理端</h1>
          <p class="text-gray-400 text-sm mt-1">AstroWind Admin</p>
        </div>
        <nav class="flex-1 p-4 space-y-1 text-sm overflow-y-auto">
          <a href="dashboard.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>📊</span><span>仪表盘</span>
          </a>
          <div class="mt-3 text-gray-500 uppercase text-xs tracking-wider px-3">内容</div>
          <a href="banners.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'banners' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>🖼️</span><span>首页 Banner</span>
          </a>
          <a href="categories.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'categories' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>🗂️</span><span>产品分类</span>
          </a>
          <a href="products.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'products' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>📦</span><span>产品管理</span>
          </a>
          <a href="product-form.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'new-product' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>➕</span><span>新增产品</span>
          </a>
          <a href="gallery.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'gallery' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>🏭</span><span>工厂实拍</span>
          </a>
          <div class="mt-3 text-gray-500 uppercase text-xs tracking-wider px-3">运营</div>
          <a href="inquiries.html" class="flex items-center gap-3 px-3 py-2 rounded-lg transition ${activePage === 'inquiries' ? 'bg-blue-600' : 'hover:bg-gray-800'}">
            <span>📨</span><span>询盘留言 <span id="nav-inquiry-count" class="ml-auto bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full"></span></span>
          </a>
        </nav>
        <div class="p-4 border-t border-gray-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              ${username ? username[0].toUpperCase() : 'A'}
            </div>
            <span class="text-sm text-gray-300">${username || 'Admin'}</span>
          </div>
          <button id="logout-btn" class="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition">
            登出
          </button>
        </div>
      </aside>
      <!-- 主内容 -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-6" id="page-content"></div>
      </main>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(layout);

    layout.querySelector('#logout-btn').onclick = async () => {
      await Auth.logoutServer();
      App.toast('已登出', 'info');
      setTimeout(() => window.location.href = 'index.html', 500);
    };

    return layout.querySelector('#page-content');
  },
};
