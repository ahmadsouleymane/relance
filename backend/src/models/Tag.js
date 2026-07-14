import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true },
    color: { type: String, default: "#f5a524" }, // default: brand amber
  },
  { timestamps: true }
);

tagSchema.index({ owner: 1, label: 1 }, { unique: true });

export default mongoose.model("Tag", tagSchema);
