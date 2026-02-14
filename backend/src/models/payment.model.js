import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    provider: { type: String, default: "midtrans" },
    midtransOrderId: { type: String, index: true },
    midtransTransactionId: { type: String },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    amount: { type: Number, required: true },
    rawResponse: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

