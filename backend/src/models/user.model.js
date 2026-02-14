import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["parent", "student", "tutor", "admin"],
      required: true,
    },
    whatsapp: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

