import { Router } from "express";
import Invoice from "../models/Invoice.js";
import Contact from "../models/Contact.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function computeTotal(items) {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "items est requis";
  for (const i of items) {
    if (!i.label?.trim()) return "Chaque article doit avoir un label";
    if (typeof i.qty !== "number" || i.qty < 1) return "Quantité invalide";
    if (typeof i.unitPrice !== "number" || i.unitPrice < 0) return "Prix unitaire invalide";
  }
  return null;
}

// TODO: tiering — à rattacher à un plan une fois la décision produit prise
router.get("/", async (req, res) => {
  const invoices = await Invoice.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ invoices });
});

router.get("/:id", async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user._id });
  if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
  res.json({ invoice });
});

router.post("/", async (req, res) => {
  const { contact, items } = req.body;
  const itemsError = validateItems(items);
  if (itemsError) return res.status(400).json({ error: itemsError });

  if (contact) {
    const exists = await Contact.exists({ _id: contact, owner: req.user._id });
    if (!exists) return res.status(400).json({ error: "Contact introuvable" });
  }

  const invoice = await Invoice.create({
    owner: req.user._id,
    contact: contact || undefined,
    items,
    total: computeTotal(items), // never trust a total sent by the client
  });
  res.status(201).json({ invoice });
});

router.patch("/:id", async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user._id });
  if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
  if (invoice.status !== "draft") return res.status(409).json({ error: "Seule une facture en brouillon peut être modifiée" });

  const { items } = req.body;
  const itemsError = validateItems(items);
  if (itemsError) return res.status(400).json({ error: itemsError });

  invoice.items = items;
  invoice.total = computeTotal(items);
  await invoice.save();
  res.json({ invoice });
});

router.delete("/:id", async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, owner: req.user._id, status: "draft" });
  if (!invoice) return res.status(404).json({ error: "Facture introuvable ou déjà envoyée" });
  res.status(204).end();
});

// Marks the invoice as shared — Relance never sends it itself, the vendor
// copies the public link and pastes it into WhatsApp by hand.
router.post("/:id/send", async (req, res) => {
  const invoice = await Invoice.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: "draft" },
    { $set: { status: "sent" } },
    { new: true }
  );
  if (!invoice) return res.status(404).json({ error: "Facture introuvable ou déjà envoyée" });
  res.json({ invoice });
});

export default router;
