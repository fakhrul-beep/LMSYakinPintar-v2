import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    grade: { type: String, required: true },
    program: { type: String },
    city: { type: String },
    area: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);

