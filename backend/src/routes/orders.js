import { Router } from "express";
import Order from "../models/Order.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";
import { requireAuth, requireAdmin, isAdminEmail } from "../middleware/auth.js";
import { createPayment, getPaymentStatus } from "../services/geniusPay.js";
import { emitToUser } from "../services/realtime.js";
import {
  createOrder,
  markOrderPaid,
  markShipped,
  confirmReceipt,
  openDispute,
  resolveDispute,
} from "../services/orderEngine.js";

const router = Router();
router.use(requireAuth);

function isParticipant(order, userId) {
  return order.buyer.equals(userId) || order.vendor.equals(userId);
}

// The confirmation code is only ever meaningful in the buyer's hands — see
// orderEngine.js. Strip it before returning an order to the vendor.
function serializeOrder(order, viewerId) {
  const json = order.toObject();
  if (!order.buyer.equals(viewerId)) delete json.confirmationCode;
  return json;
}

router.get("/", async (req, res) => {
  const { as } = req.query;
  const filter =
    as === "achats"
      ? { buyer: req.user._id }
      : as === "ventes"
      ? { vendor: req.user._id }
      : { $or: [{ buyer: req.user._id }, { vendor: req.user._id }] };

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("product", "name price photos")
    .populate("buyer", "businessName")
    .populate("vendor", "businessName");
  res.json({ orders: orders.map((o) => serializeOrder(o, req.user._id)) });
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("product", "name price photos")
    .populate("buyer", "businessName")
    .populate("vendor", "businessName");
  if (!order || (!isParticipant(order, req.user._id) && !isAdminEmail(req.user.email))) {
    return res.status(404).json({ error: "Commande introuvable" });
  }
  res.json({ order: serializeOrder(order, req.user._id) });
});

router.post("/", async (req, res) => {
  const { offerMessageId } = req.body;
  if (!offerMessageId) return res.status(400).json({ error: "offerMessageId est requis" });

  const message = await ChatMessage.findById(offerMessageId).populate("conversation");
  if (!message || message.offerPrice == null) {
    return res.status(404).json({ error: "Offre introuvable" });
  }
  const conversation = message.conversation;
  if (!conversation.buyer.equals(req.user._id)) {
    return res.status(403).json({ error: "Seul le client destinataire peut accepter cette offre" });
  }
  if (!conversation.product) {
    return res.status(400).json({ error: "Cette conversation n'est pas liée à un produit" });
  }

  const vendor = await User.findById(conversation.vendor);
  if (!vendor?.isVerifiedSeller()) {
    return res.status(403).json({ error: "Ce vendeur n'est pas encore vérifié — paiement protégé indisponible" });
  }

  try {
    const order = await createOrder({
      buyer: conversation.buyer,
      vendor: conversation.vendor,
      product: conversation.product,
      price: message.offerPrice,
      conversation: conversation._id,
      offerMessage: message._id,
    });
    emitToUser(conversation.vendor, "order:created", { orderId: order._id.toString() });
    res.status(201).json({ order: serializeOrder(order, req.user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.post("/:id/checkout", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("buyer", "businessName email phone");
  if (!order || !order.buyer._id.equals(req.user._id)) {
    return res.status(404).json({ error: "Commande introuvable" });
  }
  if (order.status !== "en_attente_paiement") {
    return res.status(409).json({ error: "Cette commande n'est plus en attente de paiement" });
  }

  const payment = await createPayment({
    amount: order.price,
    currency: "XOF",
    description: `Commande DJASSA #${order._id}`,
    customer: {
      name: order.buyer.businessName,
      email: order.buyer.email,
      phone: order.buyer.phone,
      country: "CI",
    },
    metadata: { orderId: order._id.toString() },
  });

  order.payment.reference = payment.reference;
  order.payment.geniusPaymentId = payment.id;
  order.payment.checkoutUrl = payment.checkout_url;
  order.payment.gateway = payment.gateway;
  await order.save();

  res.status(201).json({ checkoutUrl: payment.checkout_url, reference: payment.reference });
});

// Buyer-facing poll so the UI doesn't have to wait on the webhook round trip —
// same pattern as GET /api/billing/checkout/:reference.
router.get("/:id/checkout/status", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.buyer.equals(req.user._id)) {
    return res.status(404).json({ error: "Commande introuvable" });
  }

  if (order.status === "en_attente_paiement" && order.payment.reference) {
    const remote = await getPaymentStatus(order.payment.reference).catch(() => null);
    if (remote?.status === "completed") {
      await markOrderPaid(order, {
        reference: order.payment.reference,
        geniusPaymentId: order.payment.geniusPaymentId,
        gateway: remote.gateway,
      });
      emitToUser(order.vendor, "order:paid", { orderId: order._id.toString() });
    } else if (remote?.status === "failed") {
      order.payment.status = "failed";
      await order.save();
    }
  }

  res.json({ order: serializeOrder(order, req.user._id) });
});

router.post("/:id/ship", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.vendor.equals(req.user._id)) {
    return res.status(404).json({ error: "Commande introuvable" });
  }
  try {
    await markShipped(order);
    emitToUser(order.buyer, "order:shipped", {
      orderId: order._id.toString(),
      confirmationCode: order.confirmationCode,
    });
    res.json({ order: serializeOrder(order, req.user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.post("/:id/confirm", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || !order.buyer.equals(req.user._id)) {
    return res.status(404).json({ error: "Commande introuvable" });
  }
  try {
    await confirmReceipt(order);
    emitToUser(order.vendor, "order:confirmed", { orderId: order._id.toString() });
    res.json({ order: serializeOrder(order, req.user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.post("/:id/dispute", async (req, res) => {
  const { reason, evidenceUrl } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order || !order.buyer.equals(req.user._id)) {
    return res.status(404).json({ error: "Commande introuvable" });
  }
  try {
    await openDispute(order, { reason, evidenceUrl, openedBy: req.user._id });
    emitToUser(order.vendor, "order:disputed", { orderId: order._id.toString() });
    res.json({ order: serializeOrder(order, req.user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/admin/disputes", requireAdmin, async (_req, res) => {
  const orders = await Order.find({ status: "en_litige" })
    .populate("product", "name price")
    .populate("buyer", "businessName email")
    .populate("vendor", "businessName email");
  res.json({ orders });
});

router.post("/:id/dispute/resolve", requireAdmin, async (req, res) => {
  const { resolution, notes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  try {
    await resolveDispute(order, { resolution, notes });
    emitToUser(order.buyer, "order:dispute_resolved", { orderId: order._id.toString(), resolution });
    emitToUser(order.vendor, "order:dispute_resolved", { orderId: order._id.toString(), resolution });
    res.json({ order });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get("/admin/payouts", requireAdmin, async (_req, res) => {
  const orders = await Order.find({ status: "confirme", "payout.status": "pending" })
    .populate("vendor", "businessName email phone")
    .populate("product", "name");
  res.json({ orders });
});

router.post("/:id/payout/mark-paid", requireAdmin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Commande introuvable" });
  order.payout.status = "paye";
  order.payout.paidAt = new Date();
  await order.save();
  res.json({ order });
});

// Order payment confirmation arrives via the webhook registered in
// routes/billing.js (single registered URL, handles Payment and Order alike)
// — see the comment there for why this isn't a second webhook endpoint.

export default router;
