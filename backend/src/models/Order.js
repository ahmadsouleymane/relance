import mongoose from "mongoose";

// Status pipeline (see orderEngine.js for every legal transition):
//   en_attente_paiement -> paye -> expedie -> confirme
//                                          \-> en_litige -> confirme | rembourse
//   en_attente_paiement/paye can also go straight to rembourse (ship deadline missed).
const STATUSES = ["en_attente_paiement", "paye", "expedie", "confirme", "en_litige", "rembourse"];

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    // The formal offer message this order was created from — guards against
    // a double-submit creating two orders for the same accepted offer.
    offerMessage: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", unique: true, sparse: true },

    // Snapshotted at creation from the accepted offer — never recomputed from
    // Product.price later, so a vendor changing their price mid-negotiation
    // can't retroactively change what a buyer already agreed to pay.
    price: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    netAmount: { type: Number, required: true, min: 0 }, // what the vendor is owed after commission

    status: { type: String, enum: STATUSES, default: "en_attente_paiement", index: true },

    payment: {
      reference: { type: String },
      geniusPaymentId: { type: Number },
      status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
      checkoutUrl: { type: String },
      gateway: { type: String },
    },

    // Shown to the buyer (only) once the vendor marks the order "expedie" —
    // a ritual the buyer can relay to the vendor in person as a receipt-like
    // proof, not a secret the API requires back. The actual release trigger
    // is the buyer's own authenticated POST /:id/confirm — see orderEngine.js.
    confirmationCode: { type: String },

    shipBy: { type: Date },
    confirmBy: { type: Date },
    shippedAt: { type: Date },
    confirmedAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },

    dispute: {
      reason: { type: String },
      evidenceUrl: { type: String },
      openedAt: { type: Date },
      openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
      resolution: { type: String, enum: ["rembourse", "confirme"] },
      notes: { type: String },
    },

    // Actual mobile money payout to the vendor is a manual operational step
    // for now (no confirmed GeniusPay payout/transfer API) — this just tracks
    // whether the founder has settled it, reviewed via an admin-only listing.
    payout: {
      status: { type: String, enum: ["pending", "paye"], default: "pending" },
      paidAt: { type: Date },
    },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, shipBy: 1 });
orderSchema.index({ status: 1, confirmBy: 1 });

export default mongoose.model("Order", orderSchema);
