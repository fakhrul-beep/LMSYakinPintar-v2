import mongoose from "mongoose";

const learningCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

learningCategorySchema.index({ name: "text" });

export default mongoose.model("LearningCategory", learningCategorySchema);
