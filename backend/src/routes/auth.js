import { Router } from "express";
import User from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();
const TRIAL_DAYS = 7;

router.post("/register", async (req, res) => {
  const { businessName, email, phone, password } = req.body;
  if (!businessName || !email || !password) {
    return res.status(400).json({ error: "businessName, email et password sont requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email" });

  const user = new User({
    businessName,
    email,
    phone,
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
  res.json({ user: req.user, hasActiveAccess: req.user.hasActiveAccess() });
});

export default router;
