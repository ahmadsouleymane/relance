import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 }, // FCFA/XOF, no decimals — same convention as plans.js
    photos: [{ type: String }],
    stock: { type: Number, default: null, min: 0 }, // null = unlimited
    status: {
      type: String,
      enum: ["disponible", "rupture", "archive"],
      default: "disponible",
      index: true,
    },
    slug: { type: String, required: true },
  },
  { timestamps: true }
);

productSchema.index({ owner: 1, slug: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);
