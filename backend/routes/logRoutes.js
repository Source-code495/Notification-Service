import express from "express";
import { getLogs } from "../controllers/logController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, allowRoles("admin", "creator", "viewer"), getLogs);

export default router;
