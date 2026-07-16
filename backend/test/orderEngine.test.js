import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Order from "../src/models/Order.js";
import {
  createOrder,
  markOrderPaid,
  markShipped,
  confirmReceipt,
  openDispute,
  resolveDispute,
  sweepTimeouts,
} from "../src/services/orderEngine.js";
import { COMMISSION_RATE } from "../src/config/marketplace.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Order.init(); // ensure the unique offerMessage index is built before we rely on it
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Order.deleteMany({});
});

const BUYER = new mongoose.Types.ObjectId();
const VENDOR = new mongoose.Types.ObjectId();
const PRODUCT = new mongoose.Types.ObjectId();

function makeOrder(price = 10000) {
  return createOrder({ buyer: BUYER, vendor: VENDOR, product: PRODUCT, price });
}

test("createOrder snapshots price and computes commission", async () => {
  const order = await makeOrder(10000);
  assert.equal(order.status, "en_attente_paiement");
  assert.equal(order.commissionAmount, Math.round(10000 * COMMISSION_RATE));
  assert.equal(order.netAmount, 10000 - order.commissionAmount);
});

test("createOrder rejects a second order for the same offer message", async () => {
  const offerMessage = new mongoose.Types.ObjectId();
  await createOrder({ buyer: BUYER, vendor: VENDOR, product: PRODUCT, price: 5000, offerMessage });
  await assert.rejects(
    () => createOrder({ buyer: BUYER, vendor: VENDOR, product: PRODUCT, price: 5000, offerMessage }),
    /existe déjà/
  );
});

test("markOrderPaid moves en_attente_paiement -> paye and sets a ship deadline", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1", geniusPaymentId: 1, gateway: "wave" });
  assert.equal(order.status, "paye");
  assert.equal(order.payment.status, "completed");
  assert.ok(order.shipBy > new Date());
});

test("markOrderPaid refuses to pay an order twice", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await assert.rejects(() => markOrderPaid(order, { reference: "MTX-1" }), /n'est plus en attente/);
});

test("markShipped generates a confirmation code visible on the order and sets a confirm deadline", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await markShipped(order);
  assert.equal(order.status, "expedie");
  assert.match(order.confirmationCode, /^\d{6}$/);
  assert.ok(order.confirmBy > new Date());
});

test("markShipped refuses an order that hasn't been paid", async () => {
  const order = await makeOrder();
  await assert.rejects(() => markShipped(order), /pas encore été payée/);
});

test("confirmReceipt releases funds only from expedie", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await assert.rejects(() => confirmReceipt(order), /pas en attente de confirmation/);

  await markShipped(order);
  await confirmReceipt(order);
  assert.equal(order.status, "confirme");
  assert.ok(order.releasedAt);
});

test("openDispute requires a reason and a paye/expedie order", async () => {
  const order = await makeOrder();
  await assert.rejects(
    () => openDispute(order, { reason: "colis jamais reçu", openedBy: BUYER }),
    /payée ou expédiée/
  );

  await markOrderPaid(order, { reference: "MTX-1" });
  await assert.rejects(() => openDispute(order, { reason: "", openedBy: BUYER }), /motif du litige/);

  await openDispute(order, { reason: "colis jamais reçu", openedBy: BUYER });
  assert.equal(order.status, "en_litige");
  assert.equal(order.dispute.reason, "colis jamais reçu");
});

test("resolveDispute settles the order and records the resolution", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await openDispute(order, { reason: "produit différent", openedBy: BUYER });

  await resolveDispute(order, { resolution: "rembourse", notes: "vendeur injoignable" });
  assert.equal(order.status, "rembourse");
  assert.ok(order.refundedAt);
  assert.equal(order.dispute.resolution, "rembourse");
});

test("sweepTimeouts refunds a paid order past its ship deadline", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  order.shipBy = new Date(Date.now() - 1000);
  await order.save();

  const result = await sweepTimeouts();
  assert.equal(result.refunded, 1);

  const refreshed = await Order.findById(order._id);
  assert.equal(refreshed.status, "rembourse");
});

test("sweepTimeouts releases an unconfirmed order past its confirm deadline", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await markShipped(order);
  order.confirmBy = new Date(Date.now() - 1000);
  await order.save();

  const result = await sweepTimeouts();
  assert.equal(result.released, 1);

  const refreshed = await Order.findById(order._id);
  assert.equal(refreshed.status, "confirme");
});

test("sweepTimeouts never touches an order in dispute", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });
  await markShipped(order);
  await openDispute(order, { reason: "produit endommagé", openedBy: BUYER });
  order.confirmBy = new Date(Date.now() - 1000);
  await order.save();

  await sweepTimeouts();
  const refreshed = await Order.findById(order._id);
  assert.equal(refreshed.status, "en_litige");
});

test("sweepTimeouts leaves orders within their deadlines untouched", async () => {
  const order = await makeOrder();
  await markOrderPaid(order, { reference: "MTX-1" });

  const result = await sweepTimeouts();
  assert.equal(result.refunded, 0);
  assert.equal(result.released, 0);

  const refreshed = await Order.findById(order._id);
  assert.equal(refreshed.status, "paye");
});
