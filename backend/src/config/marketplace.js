// Single source of truth for the marketplace transaction pipeline — commission
// rate and the two independent deadlines that protect buyer and vendor from
// each other's silence (see docs/superpowers/plans, DJASSA pivot).
export const COMMISSION_RATE = Number(process.env.MARKETPLACE_COMMISSION_RATE || 0.05);

// Vendor must mark an order "expedie" within this window after payment, or the
// buyer is refunded automatically — catches vendors who never intended to ship.
export const SHIP_DEADLINE_HOURS = Number(process.env.MARKETPLACE_SHIP_DEADLINE_HOURS || 72);

// Buyer has this long after "expedie" to confirm receipt or open a dispute.
// Silence past this point releases funds to the vendor by default — an
// unreachable buyer must never be able to freeze a vendor's money indefinitely.
export const CONFIRM_DEADLINE_DAYS = Number(process.env.MARKETPLACE_CONFIRM_DEADLINE_DAYS || 7);

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function shipDeadlineFrom(date) {
  return new Date(date.getTime() + SHIP_DEADLINE_HOURS * HOUR_MS);
}

export function confirmDeadlineFrom(date) {
  return new Date(date.getTime() + CONFIRM_DEADLINE_DAYS * DAY_MS);
}

// FCFA/XOF, no decimals — same convention as plans.js and Product.price.
export function computeCommission(price) {
  const commissionAmount = Math.round(price * COMMISSION_RATE);
  return { commissionAmount, netAmount: price - commissionAmount };
}
