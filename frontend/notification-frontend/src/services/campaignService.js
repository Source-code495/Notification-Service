import { http } from "./http";

export async function listCampaigns() {
  const { data } = await http.get("/campaigns");
  return data;
}

export async function listCampaignsPaged(params) {
  const { data } = await http.get("/campaigns", { params });
  return data;
}

export async function createCampaign(payload) {
  const { data } = await http.post("/campaigns", payload);
  return data;
}

export async function sendCampaign(campaign_id) {
  const { data } = await http.post("/campaigns/send", { campaign_id });
  return data;
}

export async function updateCampaign(campaignId, payload) {
  const { data } = await http.put(`/campaigns/${campaignId}`, payload);
  return data;
}

export async function getCampaignRecipients(campaignId, params) {
  const { data } = await http.get(`/campaigns/${campaignId}/recipients`, { params });
  return data;
}

