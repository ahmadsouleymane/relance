import Contact from "../models/Contact.js";
import Invoice from "../models/Invoice.js";
import { getFollowUpSuggestions } from "./suggestionEngine.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOT_THRESHOLD = 60; // matches leadScoring.js's "chaud" band

export async function buildWeeklyDigest(ownerId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const [hotLeads, paidInvoices, pendingFollowUps] = await Promise.all([
    Contact.find({ owner: ownerId, leadScore: { $gte: HOT_THRESHOLD } })
      .sort({ leadScore: -1 })
      .limit(10)
      .select("displayName phoneNumber leadScore lastMessagePreview"),
    Invoice.find({ owner: ownerId, status: "paid", updatedAt: { $gte: sevenDaysAgo } }),
    getFollowUpSuggestions(ownerId, { limit: 20 }),
  ]);

  return {
    hotLeads,
    paidInvoicesCount: paidInvoices.length,
    paidInvoicesTotal: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
    pendingFollowUpsCount: pendingFollowUps.length,
  };
}
