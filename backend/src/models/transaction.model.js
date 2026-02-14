import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    type: {
      type: String,
      enum: ["income", "withdrawal", "fee"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
