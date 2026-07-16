import { Router } from "express";
import User from "../models/User.js";
import { signToken, requireAuth, isAdminEmail } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

const router = Router();
const TRIAL_DAYS = 7;

async function uniqueStoreSlug(businessName) {
  const base = slugify(businessName) || "boutique";
  let slug = base;
  let suffix = 1;
  while (await User.exists({ storeSlug: slug })) {
    slug = `${base}-${++suffix}`;
  }
  return slug;
}

router.post("/register", async (req, res) => {
  const { businessName, email, phone, password, accountType } = req.body;
  if (!businessName || !email || !password) {
    return res.status(400).json({ error: "businessName, email et password sont requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
  }
  const type = accountType === "client" ? "client" : "vendeur";

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email" });

  // The ID document itself can't be uploaded before the account exists (the
  // presigned upload endpoint requires auth) — a vendor account is created
  // immediately but starts "non_soumise" and is gated out of the public
  // marketplace and order creation (see User.isVerifiedSeller) until they
  // submit it via POST /api/verification/submit right after signing up.
  const user = new User({
    businessName,
    email,
    phone,
    accountType: type,
    storeSlug: type === "vendeur" ? await uniqueStoreSlug(businessName) : undefined,
    plan: {
      id: "starter",
      status: "trialing",
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email et password sont requis" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ error: "Identifiants invalides" });
  }

  res.json({ token: signToken(user), user });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: req.user,
    hasActiveAccess: req.user.hasActiveAccess(),
    isAdmin: isAdminEmail(req.user.email),
  });
});

router.patch("/store-slug", requireAuth, async (req, res) => {
  const { storeSlug } = req.body;
  const slug = slugify(storeSlug || "");
  if (!slug) return res.status(400).json({ error: "storeSlug invalide" });

  const taken = await User.exists({ storeSlug: slug, _id: { $ne: req.user._id } });
  if (taken) return res.status(409).json({ error: "Ce lien de boutique est déjà pris" });

  req.user.storeSlug = slug;
  await req.user.save();
  res.json({ user: req.user });
});

export default router;
