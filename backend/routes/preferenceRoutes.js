import express from "express";
import { getPreferences, updatePreferences } from "../controllers/preferenceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", verifyToken, getPreferences);
router.put("/:userId", verifyToken, updatePreferences);

export default router;
