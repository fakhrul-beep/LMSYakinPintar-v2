import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    summary: { type: String, required: true },
    score: { type: Number },
    nextPlan: { type: String },
    homework: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);

