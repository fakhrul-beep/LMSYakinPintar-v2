import mongoose from "mongoose";

const tutorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bio: { type: String },
    subjects: [{ type: String, index: true }],
    city: { type: String, index: true },
    area: { type: String, index: true },
    hourlyRate: { type: Number },
    experienceYears: { type: Number },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    profilePhoto: { type: String },
    isActive: { type: Boolean, default: true },
    availabilityNote: { type: String },
    schedule: {
      type: Map,
      of: [{ start: String, end: String }], // e.g., "monday": [{ start: "08:00", end: "10:00" }]
      default: {},
    },
    portfolio: [{ title: String, description: String, url: String }], // Link to portfolio/docs
  },
  { timestamps: true }
);

tutorSchema.index({ specialization: 1 });
tutorSchema.index({ isActive: 1 });

export default mongoose.model("Tutor", tutorSchema);

