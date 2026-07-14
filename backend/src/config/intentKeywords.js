import { stripDiacritics } from "../utils/slugify.js";

// Keywords a buyer in Côte d'Ivoire commonly uses when they're close to
// purchasing (asking price/availability/delivery), used to flag inbound
// messages as a signal for leadScoring.js — deliberately hand-picked rather
// than a generic NLP model, since the vocabulary here is narrow and local.
const KEYWORDS = [
  "combien",
  "prix",
  "coute",
  "cout",
  "dispo",
  "disponible",
  "disponibilite",
  "livraison",
  "livrer",
  "commander",
  "commande",
  "acheter",
  "payer",
  "paiement",
  "reste",
  "stock",
];

export function hasIntentSignal(text) {
  if (!text) return false;
  const normalized = stripDiacritics(text.toLowerCase());
  return KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(normalized));
}
