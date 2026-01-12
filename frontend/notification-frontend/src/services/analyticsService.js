import { http } from "./http";

export async function getOverviewAnalytics(months = 12) {
  const { data } = await http.get(`/analytics/overview?months=${encodeURIComponent(months)}`);
  return data;
}
