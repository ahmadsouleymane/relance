import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
  },
  { timestamps: true }
);

// One conversation per buyer/vendor/product triple — reopening the same
// product discussion reuses the thread instead of forking a new one.
conversationSchema.index({ buyer: 1, vendor: 1, product: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
