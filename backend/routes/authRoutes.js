import express from "express";
import { registerUser, loginUser, deleteMe } from "../controllers/authControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/me", protect, deleteMe);

export default router;
