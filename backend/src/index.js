import "dotenv/config";
import http from "node:http";
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
import uploadsRoutes from "./routes/uploads.js";
import productsRoutes from "./routes/products.js";
import publicRoutes from "./routes/public.js";
import invoicesRoutes from "./routes/invoices.js";
import digestRoutes from "./routes/digest.js";
import ordersRoutes from "./routes/orders.js";
import conversationsRoutes from "./routes/conversations.js";
import verificationRoutes from "./routes/verification.js";
import adminRoutes from "./routes/admin.js";
import { scheduleWeeklyDigestJob } from "./jobs/weeklyDigestJob.js";
import { scheduleOrderTimeoutJob } from "./jobs/orderTimeoutJob.js";
import { initRealtime } from "./services/realtime.js";
import Contact from "./models/Contact.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Mounted first, and only here, so this path gets the RAW body (needed for
// GeniusPay's HMAC signature check) instead of the parsed JSON body below.
// Handles both subscription and order payments — see routes/billing.js.
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
app.use("/api/uploads", uploadsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/digest", digestRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur" });
});

const port = process.env.PORT || 4000;
const server = http.createServer(app);
initRealtime(server);

connectDB()
  .then(async () => {
    // Backfill for contacts created before the `status` field existed — Mongoose
    // defaults only apply on hydration, not inside .aggregate(), so without this
    // the analytics funnel would bucket old contacts under null instead of "nouveau".
    await Contact.updateMany({ status: { $exists: false } }, { $set: { status: "nouveau" } });
    scheduleWeeklyDigestJob();
    scheduleOrderTimeoutJob();
    server.listen(port, () => console.log(`[api] listening on :${port}`));
  })
  .catch((err) => {
    console.error("[api] failed to start", err);
    process.exit(1);
  });
