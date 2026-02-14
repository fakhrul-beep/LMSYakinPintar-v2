import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    fullDescription: { type: String },
    coverImage: { type: String },
    duration: { type: String },
    schedule: { type: String },
    price: { type: Number, required: true },
    quota: { type: Number },
    category: { type: String, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programSchema.index({ name: "text", category: 1 });
programSchema.index({ isActive: 1 });

export default mongoose.model("Program", programSchema);
