// 认证管理
const Auth = {
  TOKEN_KEY: 'admin_token',
  USER_KEY: 'admin_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token, username) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (username) {
      localStorage.setItem(this.USER_KEY, username);
    }
  },

  getUser() {
    return localStorage.getItem(this.USER_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  // 检查认证状态，未登录则跳转
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  async login(username, password) {
    const data = await API.login(username, password);
    this.setToken(data.data.token, data.data.username);
    return data;
  },

  async logoutServer() {
    await API.logout();
    this.logout();
  },
};
