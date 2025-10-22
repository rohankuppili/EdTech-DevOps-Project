import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: String },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: { type: Number, default: 0 },
    lessons: { type: Number, default: 0 },
    tags: [String],
    thumbnail: { type: String },
    materials: [
      new mongoose.Schema(
        {
          id: { type: String },
          name: { type: String },
          type: { type: String },
          url: { type: String },
          size: { type: Number },
        },
        { _id: false }
      ),
    ],
    studentsEnrolled: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
