export const storageKeys = {
  token: "auth_token",
  theme: "app_theme",
};

export function getToken() {
  return localStorage.getItem(storageKeys.token) || "";
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(storageKeys.token);
    return;
  }
  localStorage.setItem(storageKeys.token, token);
}

export function getTheme() {
  return localStorage.getItem(storageKeys.theme) || "light";
}

export function setTheme(theme) {
  localStorage.setItem(storageKeys.theme, theme);
}
