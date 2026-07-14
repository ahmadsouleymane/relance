import { Router } from "express";
import { requireAuth, requireFeature } from "../middleware/auth.js";
import Contact from "../models/Contact.js";
import {
  getFunnel,
  getTopTags,
  getMessagingActivity,
  getTopContacts,
  getAvgResponseTime,
} from "../services/analyticsEngine.js";

const router = Router();

const STATUS_LABELS = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

function csvCell(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

router.get("/summary", requireAuth, requireFeature("analytics"), async (req, res) => {
  const ownerId = req.user._id;

  const [funnel, topTags, activity, topContacts, avgResponseTime] = await Promise.all([
    getFunnel(ownerId),
    getTopTags(ownerId),
    getMessagingActivity(ownerId),
    getTopContacts(ownerId),
    getAvgResponseTime(ownerId),
  ]);

  res.json({ funnel, topTags, activity, topContacts, avgResponseTime });
});

router.get("/contacts.csv", requireAuth, requireFeature("analytics"), async (req, res) => {
  const contacts = await Contact.find({ owner: req.user._id })
    .populate("tags")
    .sort({ lastMessageAt: -1 })
    .lean();

  const header = ["Nom", "Téléphone", "Statut", "Tags", "Dernier message", "Direction", "Nombre de messages"];
  const rows = contacts.map((c) => [
    c.displayName,
    c.phoneNumber,
    STATUS_LABELS[c.status] || c.status,
    (c.tags || []).map((t) => t.label).join("; "),
    c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : "",
    c.lastMessageDirection || "",
    c.messageCount || 0,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="contacts.csv"');
  res.send("﻿" + csv);
});

export default router;
