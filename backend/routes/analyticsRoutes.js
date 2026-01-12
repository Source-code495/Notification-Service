import express from "express";
import { getOverview } from "../controllers/analyticsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/overview", verifyToken, allowRoles("admin", "creator", "viewer"), getOverview);

export default router;
