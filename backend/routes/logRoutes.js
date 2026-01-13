import express from "express";
import { getLogs, getMyNotifications, getMyStats } from "../controllers/logController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, allowRoles("admin", "creator", "viewer"), getLogs);
router.get("/my", verifyToken, allowRoles("admin", "creator", "viewer", "user"), getMyNotifications);
router.get("/my/stats", verifyToken, allowRoles("admin", "creator", "viewer", "user"), getMyStats);
// Important: Ensure '/my/stats' is handled correctly. Express matches routes in order. 
// '/my' matches '/:id' if not careful, but there are no dynamic routes here yet.


export default router;
