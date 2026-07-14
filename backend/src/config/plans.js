// Single source of truth for pricing tiers. Amounts are in FCFA (XOF), no decimals.
export const PLANS = {
  starter: {
    id: "starter",
    label: "Starter",
    monthlyPrice: 5000,
    features: ["logging", "contacts", "tags"],
    description: "Historique des conversations, contacts et tags manuels.",
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyPrice: 15000,
    features: ["logging", "contacts", "tags", "suggestions", "reminders"],
    description: "Tout Starter + suggestions de relance et rappels.",
  },
  business: {
    id: "business",
    label: "Business",
    monthlyPrice: 45000,
    features: [
      "logging",
      "contacts",
      "tags",
      "suggestions",
      "reminders",
      "analytics",
      "multi_account",
    ],
    description: "Tout Pro + statistiques produits et comptes multiples.",
  },
};

// Billing cycle discounts — prepay to kill passive churn (no native recurring debit via GeniusPay).
export const BILLING_CYCLES = {
  monthly: { months: 1, discount: 0 },
  quarterly: { months: 3, discount: 0.1 },
  yearly: { months: 12, discount: 0.2 },
};

export function priceForCycle(planId, cycle) {
  const plan = PLANS[planId];
  const cycleInfo = BILLING_CYCLES[cycle];
  if (!plan || !cycleInfo) return null;
  const gross = plan.monthlyPrice * cycleInfo.months;
  const net = Math.round(gross * (1 - cycleInfo.discount));
  return { gross, net, discount: cycleInfo.discount, months: cycleInfo.months };
}

export function planHasFeature(planId, feature) {
  return Boolean(PLANS[planId]?.features.includes(feature));
}
