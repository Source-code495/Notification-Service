import { http } from "./http";

// ============ NEWSLETTER CATEGORIES ============
export async function listCategoriesPaged(params) {
  const { data } = await http.get("/newsletters/categories", { params });
  return data;
}

export async function createCategory(payload) {
  const { data } = await http.post("/newsletters/categories", payload);
  return data;
}

export async function updateCategory(categoryId, payload) {
  const { data } = await http.put(`/newsletters/categories/${categoryId}`, payload);
  return data;
}

// ============ NEWSLETTER ARTICLES ============
export async function listArticlesPaged(newsletterId, params) {
  const { data } = await http.get(`/newsletters/categories/${newsletterId}/articles`, { params });
  return data;
}

export async function createArticle(payload) {
  const { data } = await http.post(`/newsletters/categories/${payload.newsletter_id}/articles`, payload);
  return data;
}

export async function updateArticle(articleId, payload) {
  const { data } = await http.put(`/newsletters/articles/${articleId}`, payload);
  return data;
}

export async function publishArticle(articleId) {
  const { data } = await http.post(`/newsletters/articles/${articleId}/publish`);
  return data;
}

export async function getArticleRecipients(articleId, params) {
  const { data } = await http.get(`/newsletters/articles/${articleId}/recipients`, { params });
  return data;
}

// ============ USER SUBSCRIPTIONS ============
export async function listMyNewsletterSubscriptions() {
  const { data } = await http.get("/newsletters/me/subscriptions");
  return data;
}

export async function subscribeToNewsletter(newsletterId) {
  const { data } = await http.post(`/newsletters/categories/${newsletterId}/subscribe`);
  return data;
}

export async function unsubscribeFromNewsletter(newsletterId) {
  const { data } = await http.delete(`/newsletters/categories/${newsletterId}/subscribe`);
  return data;
}
