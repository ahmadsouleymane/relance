const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

// Weights are a product judgment call, not a statistical model: recency
// matters most (a lead gone cold is a lead gone), frequency is a secondary
// signal, and a single intent keyword hit is worth a flat bonus rather than
// scaling with how many times it was said.
const RECENCY_MAX = 40;
const FREQUENCY_MAX = 30;
const INTENT_BONUS = 30;

const THRESHOLDS = [
  { min: 60, label: "chaud" },
  { min: 30, label: "tiede" },
  { min: 0, label: "froid" },
];

export function labelFor(score) {
  return THRESHOLDS.find((t) => score >= t.min).label;
}

/**
 * recentMessages should already be filtered to this contact and to a
 * reasonable lookback window (see WINDOW_DAYS) by the caller.
 */
export function computeLeadScore(contact, recentMessages) {
  const now = Date.now();
  const cutoff = now - WINDOW_DAYS * DAY_MS;

  const inboundRecent = recentMessages.filter(
    (m) => m.direction === "inbound" && m.timestamp.getTime() >= cutoff
  );

  const daysSinceLast = contact.lastMessageAt
    ? Math.floor((now - contact.lastMessageAt.getTime()) / DAY_MS)
    : WINDOW_DAYS;
  const recencyScore = Math.max(0, RECENCY_MAX - daysSinceLast * 4);

  const frequencyScore = Math.min(inboundRecent.length, 6) * (FREQUENCY_MAX / 6);

  const intentScore = inboundRecent.some((m) => m.hasIntentSignal) ? INTENT_BONUS : 0;

  const score = Math.round(recencyScore + frequencyScore + intentScore);
  return { score, label: labelFor(score) };
}
