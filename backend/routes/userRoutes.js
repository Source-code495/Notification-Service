import express from "express";
import multer from "multer";
import {
  createUser,
  getUsers,
  getUserOptions,
  getMe,
  updateMe,
  changeMyPassword,
  updateUser,
  deleteUser,
  uploadUsers,
  getCreatorUserOptions,
  getCreatorUsers,
} from "../controllers/userController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", verifyToken, allowRoles("admin", "creator"), createUser);
router.get("/", verifyToken,allowRoles("admin"), getUsers);
router.get("/creator-users", verifyToken, allowRoles("creator",), getCreatorUsers);
router.get("/options", verifyToken, allowRoles("admin"), getUserOptions);
router.get("/creator-options", verifyToken, allowRoles("creator"), getCreatorUserOptions);
router.get("/me", verifyToken, allowRoles("admin", "creator", "viewer", "user"), getMe);
router.put("/me", verifyToken, allowRoles("admin", "creator", "viewer", "user"), updateMe);
router.put(
  "/me/password",
  verifyToken,
  allowRoles("admin", "creator", "viewer", "user"),
  changeMyPassword
);
router.put("/:id", verifyToken, allowRoles("admin","creator","user"), updateUser);
router.delete("/:id", verifyToken, allowRoles("admin","creator"), deleteUser);
router.post("/upload", verifyToken, allowRoles("admin","creator"), upload.single("file"), uploadUsers);

export default router;
