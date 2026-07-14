import mongoose from "mongoose";
import crypto from "node:crypto";

const invoiceItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    items: { type: [invoiceItemSchema], required: true, validate: (v) => v.length > 0 },
    total: { type: Number, required: true }, // derived from items, never trust client input — see routes/invoices.js
    status: { type: String, enum: ["draft", "sent", "paid"], default: "draft", index: true },
    publicToken: { type: String, required: true, unique: true, default: () => crypto.randomBytes(16).toString("hex") },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
