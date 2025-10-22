import express from "express";
import {
  createCourse,
  getCourses,
  enrollCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseControllers.js";
import { protect, educatorOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, educatorOnly, createCourse);
router.get("/", getCourses);
router.post("/:courseId/enroll", protect, enrollCourse);
router.put("/:courseId", protect, educatorOnly, updateCourse);
router.delete("/:courseId", protect, educatorOnly, deleteCourse);

export default router;
