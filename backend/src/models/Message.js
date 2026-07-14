import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true, index: true },

    waMessageId: { type: String, required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "sticker", "location", "other"],
      default: "text",
    },
    text: { type: String, default: "" },
    hasIntentSignal: { type: Boolean, default: false }, // inbound only — see config/intentKeywords.js
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

messageSchema.index({ owner: 1, waMessageId: 1 }, { unique: true });
messageSchema.index({ contact: 1, timestamp: -1 });

export default mongoose.model("Message", messageSchema);
