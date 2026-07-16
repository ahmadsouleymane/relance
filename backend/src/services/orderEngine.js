import Order from "../models/Order.js";
import { computeCommission, shipDeadlineFrom, confirmDeadlineFrom } from "../config/marketplace.js";
import { generateConfirmationCode } from "../utils/confirmationCode.js";

function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function createOrder({ buyer, vendor, product, price, conversation, offerMessage }) {
  const { commissionAmount, netAmount } = computeCommission(price);
  try {
    return await Order.create({
      buyer,
      vendor,
      product,
      conversation,
      offerMessage,
      price,
      commissionAmount,
      netAmount,
      status: "en_attente_paiement",
    });
  } catch (err) {
    if (err.code === 11000) throw fail(409, "Une commande existe déjà pour cette offre");
    throw err;
  }
}

export async function markOrderPaid(order, { reference, geniusPaymentId, gateway }) {
  if (order.status !== "en_attente_paiement") {
    throw fail(409, "Cette commande n'est plus en attente de paiement");
  }
  order.payment.status = "completed";
  order.payment.reference = reference;
  order.payment.geniusPaymentId = geniusPaymentId;
  order.payment.gateway = gateway;
  order.status = "paye";
  order.shipBy = shipDeadlineFrom(new Date());
  await order.save();
  return order;
}

// Generates a fresh confirmation code, shown once to the buyer (never to the
// vendor) as a ritual the buyer can relay to the vendor on physical handoff —
// it is NOT required by confirmReceipt below. The actual release trigger is
// the buyer's own authenticated confirmation, which is the only action that
// genuinely proves nothing but the buyer can perform (a vendor has no way to
// forge it). Requiring the code back from the vendor would just create a
// self-loop with no real vendor for confirmation.
export async function markShipped(order) {
  if (order.status !== "paye") {
    throw fail(409, "Cette commande n'a pas encore été payée");
  }
  order.confirmationCode = generateConfirmationCode();
  order.status = "expedie";
  order.shippedAt = new Date();
  order.confirmBy = confirmDeadlineFrom(new Date());
  await order.save();
  return order;
}

export async function confirmReceipt(order) {
  if (order.status !== "expedie") {
    throw fail(409, "Cette commande n'est pas en attente de confirmation de réception");
  }
  order.status = "confirme";
  order.confirmedAt = new Date();
  order.releasedAt = new Date();
  await order.save();
  return order;
}

export async function openDispute(order, { reason, evidenceUrl, openedBy }) {
  if (!["paye", "expedie"].includes(order.status)) {
    throw fail(409, "Un litige ne peut être ouvert que sur une commande payée ou expédiée");
  }
  if (!reason?.trim()) {
    throw fail(400, "Le motif du litige est requis");
  }
  order.status = "en_litige";
  order.dispute = {
    reason: reason.trim(),
    evidenceUrl,
    openedAt: new Date(),
    openedBy,
  };
  await order.save();
  return order;
}

export async function resolveDispute(order, { resolution, notes }) {
  if (order.status !== "en_litige") {
    throw fail(409, "Cette commande n'est pas en litige");
  }
  if (!["rembourse", "confirme"].includes(resolution)) {
    throw fail(400, "Résolution invalide — attendu 'rembourse' ou 'confirme'");
  }
  order.status = resolution;
  order.dispute.resolvedAt = new Date();
  order.dispute.resolution = resolution;
  order.dispute.notes = notes;
  if (resolution === "rembourse") order.refundedAt = new Date();
  if (resolution === "confirme") order.releasedAt = new Date();
  await order.save();
  return order;
}

// Silence must never favor whichever party benefits from stalling — a vendor
// who never ships gets the buyer refunded, a buyer who never confirms (and
// never disputes) releases funds to the vendor. Run on a schedule, not
// per-request, so both deadlines fire even if nobody visits the app.
export async function sweepTimeouts(now = new Date()) {
  const unshipped = await Order.find({ status: "paye", shipBy: { $lt: now } });
  for (const order of unshipped) {
    order.status = "rembourse";
    order.refundedAt = now;
    await order.save();
  }

  const unconfirmed = await Order.find({ status: "expedie", confirmBy: { $lt: now } });
  for (const order of unconfirmed) {
    order.status = "confirme";
    order.confirmedAt = now;
    order.releasedAt = now;
    await order.save();
  }

  return { refunded: unshipped.length, released: unconfirmed.length };
}
