import { Router } from "express";
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { PLANS, BILLING_CYCLES, priceForCycle } from "../config/plans.js";
import { createPayment, getPaymentStatus, verifyWebhookSignature } from "../services/geniusPay.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { markOrderPaid } from "../services/orderEngine.js";
import { emitToUser } from "../services/realtime.js";

const router = Router();

router.get("/plans", (_req, res) => {
  res.json({ plans: PLANS, cycles: BILLING_CYCLES });
});

router.post("/checkout", requireAuth, async (req, res) => {
  const { planId, cycle } = req.body;
  if (!PLANS[planId]) return res.status(400).json({ error: "Plan inconnu" });
  if (!BILLING_CYCLES[cycle]) return res.status(400).json({ error: "Cycle de facturation inconnu" });

  const price = priceForCycle(planId, cycle);

  const payment = await createPayment({
    amount: price.net,
    currency: "XOF",
    description: `${PLANS[planId].label} — ${BILLING_CYCLES[cycle].months} mois`,
    customer: {
      name: req.user.businessName,
      email: req.user.email,
      phone: req.user.phone,
      country: "CI",
    },
    metadata: {
      userId: req.user._id.toString(),
      planId,
      cycle,
    },
  });

  await Payment.create({
    owner: req.user._id,
    planId,
    cycle,
    reference: payment.reference,
    geniusPaymentId: payment.id,
    amount: payment.amount,
    fees: payment.fees,
    netAmount: payment.net_amount,
    currency: payment.currency || "XOF",
    status: "pending",
    gateway: payment.gateway,
    checkoutUrl: payment.checkout_url,
  });

  res.status(201).json({
    checkoutUrl: payment.checkout_url,
    reference: payment.reference,
  });
});

// Vendor-facing poll so the frontend can show "en attente de confirmation" ->
// "actif" without waiting on the webhook round trip during a live checkout.
router.get("/checkout/:reference", requireAuth, async (req, res) => {
  const payment = await Payment.findOne({ reference: req.params.reference, owner: req.user._id });
  if (!payment) return res.status(404).json({ error: "Paiement introuvable" });

  if (payment.status === "pending") {
    const remote = await getPaymentStatus(payment.reference).catch(() => null);
    if (remote?.status === "completed") {
      await activateSubscription(payment, remote);
    } else if (remote?.status) {
      payment.status = remote.status === "failed" ? "failed" : payment.status;
      await payment.save();
    }
  }

  res.json({ payment });
});

async function activateSubscription(payment, remoteData) {
  payment.status = "completed";
  payment.rawWebhookPayload = payment.rawWebhookPayload || remoteData;
  await payment.save();

  const { months } = BILLING_CYCLES[payment.cycle];
  const user = await User.findById(payment.owner);
  if (!user) return;

  const base = user.hasActiveAccess() && user.plan.currentPeriodEnd > new Date()
    ? user.plan.currentPeriodEnd
    : new Date();
  const currentPeriodEnd = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000);

  user.plan.id = payment.planId;
  user.plan.status = "active";
  user.plan.currentPeriodEnd = currentPeriodEnd;
  await user.save();
}

// GeniusPay webhook receiver. Mounted with express.raw() so req.body is the
// exact bytes GeniusPay signed — needed for HMAC verification.
//
// This is the ONE webhook URL registered with GeniusPay (scripts/registerWebhook.js
// registers a single endpoint per environment). It handles BOTH subscription
// payments (Payment docs, checkout in this file) and marketplace order
// payments (Order docs, checkout in routes/orders.js) by trying both
// collections against the reference — simpler and safer than registering a
// second webhook URL, since we don't know whether GeniusPay supports more
// than one active subscription per merchant account.
export const webhookRouter = Router();
webhookRouter.post(
  "/geniuspay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.header("X-Webhook-Signature");
    const timestamp = req.header("X-Webhook-Timestamp");
    const rawBody = req.body.toString("utf8");

    let valid = false;
    try {
      valid = verifyWebhookSignature({ rawBody, timestamp, signature });
    } catch (err) {
      console.error("[billing:webhook] signature check errored", err);
    }
    if (!valid) return res.status(401).json({ error: "Signature invalide" });

    const event = JSON.parse(rawBody);
    const reference = event.data?.reference;
    if (!reference) return res.status(200).json({ received: true });

    const payment = await Payment.findOne({ reference });
    if (payment) {
      if (event.event === "payment.success") {
        await activateSubscription(payment, event.data);
      } else if (event.event === "payment.failed") {
        payment.status = "failed";
        payment.rawWebhookPayload = event.data;
        await payment.save();
      }
      return res.status(200).json({ received: true });
    }

    const order = await Order.findOne({ "payment.reference": reference });
    if (order) {
      if (event.event === "payment.success" && order.status === "en_attente_paiement") {
        await markOrderPaid(order, {
          reference,
          geniusPaymentId: order.payment.geniusPaymentId,
          gateway: event.data.gateway,
        });
        emitToUser(order.vendor, "order:paid", { orderId: order._id.toString() });
      } else if (event.event === "payment.failed") {
        order.payment.status = "failed";
        await order.save();
      }
      return res.status(200).json({ received: true });
    }

    res.status(200).json({ received: true }); // unknown reference — ignore
  }
);

export default router;
