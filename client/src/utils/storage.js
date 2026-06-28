const TOKEN_KEY = 'ldarcp.token';
const USER_KEY = 'ldarcp.user';
const THEME_KEY = 'ldarcp.theme';

export const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (!token) return localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    if (!user) return localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getTheme() {
    return localStorage.getItem(THEME_KEY); // 'dark' | 'light' | null
  },
  setTheme(theme) {
    if (!theme) return localStorage.removeItem(THEME_KEY);
    localStorage.setItem(THEME_KEY, theme);
  }
};
