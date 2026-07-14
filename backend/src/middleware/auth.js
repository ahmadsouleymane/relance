import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { PLANS } from "../config/plans.js";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentification requise" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée" });
  }
}

export function requireFeature(feature) {
  return (req, res, next) => {
    const planId = req.user.plan.id;
    if (!PLANS[planId]?.features.includes(feature)) {
      return res.status(403).json({ error: `Fonctionnalité réservée aux plans supérieurs (${feature})` });
    }
    next();
  };
}
