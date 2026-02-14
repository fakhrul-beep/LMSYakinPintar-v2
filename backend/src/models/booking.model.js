import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    subject: { type: String, required: true },
    mode: { type: String, enum: ["offline", "online"], default: "offline" },
    city: { type: String },
    area: { type: String },
    scheduledAt: { type: Date, required: true },
    durationHours: { type: Number, default: 2 },
    priceTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },
    paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);

