import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "completed", "rejected"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "e_wallet"],
      required: true,
    },
    accountDetails: {
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      eWalletType: String, // OVO, GoPay, Dana
      phoneNumber: String,
    },
    processedAt: Date,
    adminNote: String,
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
