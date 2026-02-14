import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["student", "tutor"], required: true },
    payload: { type: Object, required: true },
    source: { type: String, default: "landing-page" }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);

