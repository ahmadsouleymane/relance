import mongoose from "mongoose";
import { labelFor } from "../services/leadScoring.js";

const contactSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    waId: { type: String, required: true }, // e.g. "2250700000000@s.whatsapp.net"
    phoneNumber: { type: String, required: true },
    displayName: { type: String, trim: true },
    pushName: { type: String, trim: true }, // name as broadcast by the contact's WhatsApp

    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    notes: { type: String, trim: true, default: "" },

    lastMessageAt: { type: Date },
    lastMessageDirection: { type: String, enum: ["inbound", "outbound"] },
    lastMessagePreview: { type: String, trim: true },

    // set when the vendor manually marks a suggestion as handled, so it stops resurfacing
    lastFollowUpAt: { type: Date },

    messageCount: { type: Number, default: 0 },

    // Recomputed periodically (see jobs/weeklyDigestJob.js) rather than on
    // every inbound message — it depends on 30-day aggregates, too costly
    // to recalc synchronously on ingest.
    leadScore: { type: Number, default: 0, index: true },

    status: {
      type: String,
      enum: ["nouveau", "en_negociation", "client", "perdu"],
      default: "nouveau",
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({ owner: 1, waId: 1 }, { unique: true });
contactSchema.index({ owner: 1, lastMessageAt: -1 });
contactSchema.index({ owner: 1, status: 1 });

contactSchema.virtual("leadLabel").get(function () {
  return labelFor(this.leadScore || 0);
});
contactSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Contact", contactSchema);
