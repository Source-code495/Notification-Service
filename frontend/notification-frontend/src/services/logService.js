import { http } from "./http";

export async function listLogs() {
  const { data } = await http.get("/logs");
  return data;
}

export async function listLogsPaged(params) {
  const { data } = await http.get("/logs", { params });
  return data;
}
