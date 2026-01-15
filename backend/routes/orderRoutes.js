import express from "express";
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, allowRoles("user"), createOrder);
router.get("/my", verifyToken, allowRoles("user"), getMyOrders);
router.get("/", verifyToken, allowRoles("admin", "creator"), getAllOrders);
router.patch("/:id/status", verifyToken, allowRoles("admin","creator"), updateOrderStatus);

export default router;
