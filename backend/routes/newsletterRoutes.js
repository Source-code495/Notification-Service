import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  createArticle,
  getArticles,
  updateArticle,
  publishArticle,
  getArticleRecipients,
  subscribeToCategory,
  unsubscribeFromCategory,
  getMySubscriptions,
} from "../controllers/newsletterController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ============ NEWSLETTER CATEGORIES ============
// POST /newsletters/categories - Create category
router.post("/categories", verifyToken, allowRoles("admin", "creator"), createCategory);

// GET /newsletters/categories - List categories (with pagination)
router.get("/categories", verifyToken, allowRoles("admin", "creator", "viewer", "user"), getCategories);

// GET /newsletters/me/subscriptions - List my subscriptions
router.get("/me/subscriptions", verifyToken, allowRoles("user"), getMySubscriptions);

// POST /newsletters/categories/:newsletter_id/subscribe - Subscribe to a newsletter
router.post(
  "/categories/:newsletter_id/subscribe",
  verifyToken,
  allowRoles("user"),
  subscribeToCategory
);

// DELETE /newsletters/categories/:newsletter_id/subscribe - Unsubscribe from a newsletter
router.delete(
  "/categories/:newsletter_id/subscribe",
  verifyToken,
  allowRoles("user"),
  unsubscribeFromCategory
);

// PUT /newsletters/categories/:categoryId - Update category
router.put("/categories/:categoryId", verifyToken, allowRoles("admin", "creator"), updateCategory);

// ============ NEWSLETTER ARTICLES (Nested under categories) ============
// POST /newsletters/categories/:newsletter_id/articles - Create article in category
router.post(
  "/categories/:newsletter_id/articles",
  verifyToken,
  allowRoles("admin", "creator"),
  createArticle
);

// GET /newsletters/categories/:newsletter_id/articles - List articles in category
router.get(
  "/categories/:newsletter_id/articles",
  verifyToken,
  allowRoles("admin", "creator", "viewer", "user"),
  getArticles
);

// PUT /newsletters/articles/:article_id - Update article
router.put("/articles/:article_id", verifyToken, allowRoles("admin", "creator"), updateArticle);

// POST /newsletters/articles/:article_id/publish - Publish article to users
router.post("/articles/:article_id/publish", verifyToken, allowRoles("admin", "creator"), publishArticle);

// GET /newsletters/articles/:article_id/recipients - Get article recipients (draft preview or sent logs)
router.get(
  "/articles/:article_id/recipients",
  verifyToken,
  allowRoles("admin", "creator", "viewer"),
  getArticleRecipients
);

export default router;
