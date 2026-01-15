import { http } from "./http";

export async function createOrder(data) {
  const { data: response } = await http.post("/orders", data);
  return response;
}

export async function getMyOrders(params) {
  const { data } = await http.get("/orders/my", { params });
  return data;
}

export async function getAllOrders(params) {
  const { data } = await http.get("/orders", { params });
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await http.patch(`/orders/${id}/status`, { status });
  return data;
}
