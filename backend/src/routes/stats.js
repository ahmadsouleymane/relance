import { Router } from "express";
import Contact from "../models/Contact.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";
import { getFollowUpSuggestions } from "../services/suggestionEngine.js";
import { planHasFeature } from "../config/plans.js";

const router = Router();
const DAY_MS = 24 * 60 * 60 * 1000;

router.get("/dashboard", requireAuth, async (req, res) => {
  const ownerId = req.user._id;
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const [totalContacts, messagesLast7d, inboundLast7d, outboundLast7d] = await Promise.all([
    Contact.countDocuments({ owner: ownerId }),
    Message.countDocuments({ owner: ownerId, timestamp: { $gte: sevenDaysAgo } }),
    Message.countDocuments({ owner: ownerId, timestamp: { $gte: sevenDaysAgo }, direction: "inbound" }),
    Message.countDocuments({ owner: ownerId, timestamp: { $gte: sevenDaysAgo }, direction: "outbound" }),
  ]);

  const pendingFollowUps = planHasFeature(req.user.plan.id, "suggestions")
    ? (await getFollowUpSuggestions(ownerId, { limit: 500 })).length
    : null;

  res.json({
    totalContacts,
    messagesLast7d,
    inboundLast7d,
    outboundLast7d,
    pendingFollowUps,
    analyticsEnabled: planHasFeature(req.user.plan.id, "analytics"),
  });
});

export default router;
