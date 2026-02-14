import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "CREATE_PROGRAM", "UPDATE_TUTOR"
    entity: { type: String, required: true }, // e.g., "Program", "Tutor"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
