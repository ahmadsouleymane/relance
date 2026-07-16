import mongoose from "mongoose";

// Named ChatMessage (not Message) to avoid any collision with the existing
// WhatsApp ingestion Message model — this is a fully separate, in-app-only
// messaging system between marketplace buyers and vendors (see CLAUDE.md:
// the WhatsApp integration stays read-only and CRM-scoped, untouched by this).
const chatMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },

    // Present only on a formal price offer from the vendor — the message that
    // an order gets created from (see routes/orders.js). A plain chat message
    // (negotiation, questions) has no offerPrice.
    offerPrice: { type: Number, min: 0 },

    readAt: { type: Date },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
