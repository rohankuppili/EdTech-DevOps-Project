import { Course } from "../models/Course.js";
import { User } from "../models/User.js";

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, tags } = req.body;
    const instructor = req.user._id;

    const course = await Course.create({
      title,
      description,
      instructor,
      price,
      tags,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to create course", error });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error });
  }
};

// Enroll student in a course
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.studentsEnrolled.includes(userId))
      return res.status(400).json({ message: "Already enrolled" });

    course.studentsEnrolled.push(userId);
    await course.save();

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Enrollment failed", error });
  }
};
