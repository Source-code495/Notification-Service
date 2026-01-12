import { jwtDecode } from "jwt-decode";

export function decodeToken(token) {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(decoded) {
  if (!decoded || !decoded.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowSec;
}

export function normalizeRole(role) {
  if (!role) return "";
  return String(role).toLowerCase();
}

export function getRoleHomePath(role) {
  const r = normalizeRole(role);
  if (r === "admin") return "/admin";
  if (r === "creator") return "/creator";
  if (r === "viewer") return "/viewer";
  if (r === "user") return "/app";
  return "/login";
}
