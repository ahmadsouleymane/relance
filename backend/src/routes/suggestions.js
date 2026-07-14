import { Router } from "express";
import { requireAuth, requireFeature } from "../middleware/auth.js";
import { getFollowUpSuggestions } from "../services/suggestionEngine.js";

const router = Router();

router.get("/", requireAuth, requireFeature("suggestions"), async (req, res) => {
  const suggestions = await getFollowUpSuggestions(req.user._id);
  res.json({ suggestions });
});

export default router;
