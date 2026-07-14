import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    planId: { type: String, enum: ["starter", "pro", "business"], required: true },
    cycle: { type: String, enum: ["monthly", "quarterly", "yearly"], required: true },

    reference: { type: String, required: true, unique: true }, // GeniusPay reference (e.g. MTX-...)
    geniusPaymentId: { type: Number },
    amount: { type: Number, required: true },
    fees: { type: Number },
    netAmount: { type: Number },
    currency: { type: String, default: "XOF" },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "expired"],
      default: "pending",
    },
    gateway: { type: String }, // wave, orange_money, mtn_momo, moov, card...
    checkoutUrl: { type: String },

    rawWebhookPayload: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
