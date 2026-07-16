import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    storeSlug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },

    // "vendeur" is the historical default — every account created before the
    // marketplace pivot is a vendor using the CRM, so this keeps them valid.
    accountType: { type: String, enum: ["vendeur", "client"], default: "vendeur", index: true },

    // Only relevant for accountType "vendeur" — a client never sells, so never
    // needs identity verification. Gates the ability to receive marketplace orders.
    sellerVerification: {
      status: {
        type: String,
        enum: ["non_soumise", "en_attente", "approuvee", "rejetee"],
        default: "non_soumise",
      },
      idDocumentUrl: { type: String },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
    },

    plan: {
      id: { type: String, enum: ["starter", "pro", "business"], default: "starter" },
      status: {
        type: String,
        enum: ["trialing", "active", "expired", "canceled"],
        default: "trialing",
      },
      trialEndsAt: { type: Date },
      currentPeriodEnd: { type: Date },
    },

    whatsapp: {
      status: {
        type: String,
        enum: ["disconnected", "connecting", "connected"],
        default: "disconnected",
      },
      phoneNumber: { type: String },
      lastConnectedAt: { type: Date },
      lastDisconnectedAt: { type: Date },
      historySyncStatus: {
        type: String,
        enum: ["idle", "syncing", "complete"],
        default: "idle",
      },
      historySyncedCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10);
};

userSchema.methods.checkPassword = function checkPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.hasActiveAccess = function hasActiveAccess() {
  const { status, trialEndsAt, currentPeriodEnd } = this.plan;
  if (status === "trialing") return !trialEndsAt || trialEndsAt > new Date();
  if (status === "active") return !currentPeriodEnd || currentPeriodEnd > new Date();
  return false;
};

userSchema.methods.isVerifiedSeller = function isVerifiedSeller() {
  return this.accountType === "vendeur" && this.sellerVerification.status === "approuvee";
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
