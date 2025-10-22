import { Course } from "../models/Course.js";
import { User } from "../models/User.js";

// Create new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, tags, duration, lessons, thumbnail, materials } = req.body;
    const instructor = req.user._id;

    const course = await Course.create({
      title,
      description,
      duration,
      instructor,
      price,
      lessons,
      tags,
      thumbnail,
      materials,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to create course", error });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "_id name email");
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

// Update a course (instructor-only, ownership check)
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, price, tags, duration, lessons, thumbnail, materials } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    if (typeof title === "string") course.title = title;
    if (typeof description === "string") course.description = description;
    if (typeof duration === "string") course.duration = duration;
    if (typeof price === "number") course.price = price;
    if (Array.isArray(tags)) course.tags = tags;
    if (typeof lessons === "number" && !Number.isNaN(lessons)) course.lessons = lessons;
    if (typeof thumbnail === "string") course.thumbnail = thumbnail;
    if (Array.isArray(materials)) course.materials = materials;

    const updated = await course.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update course", error });
  }
};

// Delete a course (instructor-only, ownership check)
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    await course.deleteOne();
    res.json({ message: "Course deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course", error });
  }
};
