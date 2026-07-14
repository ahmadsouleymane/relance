import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildWeeklyDigest } from "../services/weeklyDigest.js";

const router = Router();
router.use(requireAuth);

router.get("/weekly", async (req, res) => {
  const digest = await buildWeeklyDigest(req.user._id);
  res.json(digest);
});

export default router;
