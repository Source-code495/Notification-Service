import express from "express";
import { register, login, AdminRegister } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin/register",verifyToken, allowRoles("admin"),AdminRegister);

export default router;
