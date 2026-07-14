import Contact from "../models/Contact.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Minimum silence before a contact is worth surfacing at all.
const MIN_DAYS_SILENT = 1;

const URGENCY_BANDS = [
  { minDays: 7, level: "critique", label: "Risque de perte" },
  { minDays: 3, level: "attention", label: "À relancer" },
  { minDays: MIN_DAYS_SILENT, level: "info", label: "À relancer bientôt" },
];

function bandFor(daysSince) {
  return URGENCY_BANDS.find((b) => daysSince >= b.minDays) || null;
}

// Lower index = more urgent. Used as the primary sort key so leadScore only
// breaks ties within the same urgency band, never overrides it — silence
// duration is still the product's primary signal.
const BAND_RANK = Object.fromEntries(URGENCY_BANDS.map((b, i) => [b.level, i]));

/**
 * A contact needs a follow-up suggestion when the vendor is the one who owes
 * a reply: the last message on the thread came from the client (inbound),
 * and the vendor hasn't dismissed/answered it since.
 *
 * This never sends anything — it only surfaces contacts in the UI so the
 * vendor can pick up the conversation manually from their own phone.
 */
export async function getFollowUpSuggestions(ownerId, { limit = 200 } = {}) {
  const now = Date.now();

  const candidates = await Contact.find({
    owner: ownerId,
    lastMessageDirection: "inbound",
    lastMessageAt: { $lte: new Date(now - MIN_DAYS_SILENT * DAY_MS) },
  })
    .sort({ lastMessageAt: 1 })
    .populate("tags")
    .limit(limit);

  const suggestions = [];
  for (const contact of candidates) {
    if (contact.lastFollowUpAt && contact.lastFollowUpAt >= contact.lastMessageAt) continue;

    const daysSince = Math.floor((now - contact.lastMessageAt.getTime()) / DAY_MS);
    const band = bandFor(daysSince);
    if (!band) continue;

    suggestions.push({
      contact,
      daysSince,
      urgency: band.level,
      reason: band.label,
      preview: contact.lastMessagePreview,
      leadScore: contact.leadScore || 0,
    });
  }

  // Most urgent band first; within a band, hottest lead first.
  suggestions.sort((a, b) => BAND_RANK[a.urgency] - BAND_RANK[b.urgency] || b.leadScore - a.leadScore);
  return suggestions;
}
