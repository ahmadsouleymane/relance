import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },

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

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
