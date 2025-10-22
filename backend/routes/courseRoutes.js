import express from "express";
import {
  createCourse,
  getCourses,
  enrollCourse,
} from "../controllers/courseControllers.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCourse);
router.get("/", getCourses);
router.post("/:courseId/enroll", protect, enrollCourse);

export default router;
