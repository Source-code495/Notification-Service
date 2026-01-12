import { http } from "./http";

export async function getPreferences(userId) {
  const { data } = await http.get(`/preferences/${userId}`);
  return data;
}

export async function updatePreferences(userId, payload) {
  const { data } = await http.put(`/preferences/${userId}`, payload);
  return data;
}
