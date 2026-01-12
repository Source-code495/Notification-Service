import express from "express";
import {
  createCampaign,
  getCampaigns,
  sendCampaign,
  updateCampaign,
} from "../controllers/campaignController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, allowRoles("admin", "creator"), createCampaign);
router.get("/", verifyToken,allowRoles("admin", "creator", "viewer"),getCampaigns);
router.post("/send", verifyToken, allowRoles("admin", "creator"), sendCampaign);
router.put("/:campaignId", verifyToken, allowRoles("admin", "creator"), updateCampaign);

export default router;
