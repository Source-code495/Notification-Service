import { http } from "./http";

export async function listUsers() {
  const { data } = await http.get("/users");
  return data;
}

export async function listUsersPaged(params) {
  const { data } = await http.get("/users", { params });
  return data;
}

export async function getUserOptions() {
  const { data } = await http.get("/users/options");
  return data;
}

export async function getMe() {
  const { data } = await http.get("/users/me");
  return data;
}

export async function updateMe(payload) {
  const { data } = await http.put("/users/me", payload);
  return data;
}

export async function changeMyPassword(payload) {
  const { data } = await http.put("/users/me/password", payload);
  return data;
}

export async function createUser(payload) {
  const { data } = await http.post("/users", payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await http.put(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id) {
  const { data } = await http.delete(`/users/${id}`);
  return data;
}

export async function uploadUsersCsv(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await http.post("/users/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
