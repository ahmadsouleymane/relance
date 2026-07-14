import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import whatsappRoutes from "./routes/whatsapp.js";
import contactsRoutes from "./routes/contacts.js";
import tagsRoutes from "./routes/tags.js";
import suggestionsRoutes from "./routes/suggestions.js";
import statsRoutes from "./routes/stats.js";
import analyticsRoutes from "./routes/analytics.js";
import billingRoutes, { webhookRouter } from "./routes/billing.js";
import Contact from "./models/Contact.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Mounted first, and only here, so this path gets the RAW body (needed for
// GeniusPay's HMAC signature check) instead of the parsed JSON body below.
app.use("/api/billing/webhook", webhookRouter);

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/billing", billingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

const port = process.env.PORT || 4000;

connectDB()
  .then(async () => {
    // Backfill for contacts created before the `status` field existed — Mongoose
    // defaults only apply on hydration, not inside .aggregate(), so without this
    // the analytics funnel would bucket old contacts under null instead of "nouveau".
    await Contact.updateMany({ status: { $exists: false } }, { $set: { status: "nouveau" } });
    app.listen(port, () => console.log(`[api] listening on :${port}`));
  })
  .catch((err) => {
    console.error("[api] failed to start", err);
    process.exit(1);
  });
