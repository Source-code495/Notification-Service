import axios from "axios";
import { getToken } from "../utils/storage";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error) {
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong";
  return String(msg);
}
