import { Router } from "express";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/status", async (req, res) => {
  res.json({ sellerVerification: req.user.sellerVerification });
});

router.post("/submit", async (req, res) => {
  if (req.user.accountType !== "vendeur") {
    return res.status(400).json({ error: "Seul un compte vendeur peut soumettre une vérification" });
  }
  const { idDocumentUrl } = req.body;
  if (!idDocumentUrl) return res.status(400).json({ error: "idDocumentUrl est requis" });

  req.user.sellerVerification = {
    status: "en_attente",
    idDocumentUrl,
    submittedAt: new Date(),
  };
  await req.user.save();
  res.json({ sellerVerification: req.user.sellerVerification });
});

router.get("/admin/pending", requireAdmin, async (_req, res) => {
  const users = await User.find({ "sellerVerification.status": "en_attente" }).select(
    "businessName email phone sellerVerification"
  );
  res.json({ users });
});

router.post("/admin/:userId/review", requireAdmin, async (req, res) => {
  const { approve, rejectionReason } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  user.sellerVerification.status = approve ? "approuvee" : "rejetee";
  user.sellerVerification.reviewedAt = new Date();
  user.sellerVerification.rejectionReason = approve ? undefined : rejectionReason;
  await user.save();
  res.json({ sellerVerification: user.sellerVerification });
});

export default router;
