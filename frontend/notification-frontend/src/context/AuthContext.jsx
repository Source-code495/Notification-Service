import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { decodeToken, getRoleHomePath, isTokenExpired, normalizeRole } from "../utils/auth";
import { getToken, setToken } from "../utils/storage";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [decoded, setDecoded] = useState(() => decodeToken(getToken()));

  useEffect(() => {
    const t = getToken();
    setTokenState(t);
    setDecoded(decodeToken(t));
  }, []);

  const isAuthenticated = !!token && !!decoded && !isTokenExpired(decoded);
  const role = normalizeRole(decoded?.role);
  const userId = decoded?.userId;

  function persistToken(newToken) {
    setToken(newToken);
    setTokenState(newToken);
    setDecoded(decodeToken(newToken));
  }

  async function login(email, password) {
    const result = await authService.login({ email, password });
    persistToken(result.token);
    const d = decodeToken(result.token);
    return { homePath: getRoleHomePath(d?.role) };
  }

  async function register(name, email, password) {
    return await authService.register({ name, email, password });
  }

  async function adminRegister(name, email, password, role) {
    return await authService.adminRegister({ name, email, password, role });
  }

  function logout() {
    persistToken("");
  }

  const value = useMemo(
    () => ({
      token,
      decoded,
      isAuthenticated,
      role,
      userId,
      login,
      register,
      adminRegister,
      logout,
    }),
    [token, decoded, isAuthenticated, role, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
