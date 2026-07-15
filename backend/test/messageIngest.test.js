import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Contact from "../src/models/Contact.js";
import Message from "../src/models/Message.js";
import { logInboundMessage, logOutboundMessage, isTrackableChat, logHistoryMessages } from "../src/services/messageIngest.js";

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Contact.deleteMany({});
  await Message.deleteMany({});
});

const OWNER = new mongoose.Types.ObjectId();

function waMessage({
  id,
  remoteJid = "2250700000001@s.whatsapp.net",
  fromMe = false,
  secondsAgo = 0,
  text = "Bonjour",
  pushName = "Aïcha",
}) {
  return {
    key: { remoteJid, fromMe, id },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000) - secondsAgo,
    pushName,
  };
}

test("isTrackableChat rejects groups and status broadcasts", () => {
  assert.equal(isTrackableChat("2250700000001@s.whatsapp.net"), true);
  assert.equal(isTrackableChat("12345-6789@g.us"), false);
  assert.equal(isTrackableChat("status@broadcast"), false);
  assert.equal(isTrackableChat(null), false);
});

test("logInboundMessage creates a contact and a message", async () => {
  await logInboundMessage(OWNER, waMessage({ id: "MSG1", text: "Combien coûte la robe ?" }));

  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.lastMessageDirection, "inbound");
  assert.equal(contact.messageCount, 1);
  assert.equal(contact.lastMessagePreview, "Combien coûte la robe ?");

  const messages = await Message.find({ owner: OWNER });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].hasIntentSignal, true);
});

test("redelivering the same waMessageId does not inflate messageCount", async () => {
  const msg = waMessage({ id: "MSG-DUPE" });
  await logInboundMessage(OWNER, msg);
  await logInboundMessage(OWNER, msg); // Baileys redelivers on reconnect

  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.messageCount, 1);
  assert.equal(await Message.countDocuments({ owner: OWNER }), 1);
});

test("logOutboundMessage stamps lastFollowUpAt", async () => {
  await logInboundMessage(OWNER, waMessage({ id: "IN1", secondsAgo: 5 }));
  await logOutboundMessage(OWNER, waMessage({ id: "OUT1", fromMe: true, secondsAgo: 0, text: "Merci, disponible demain" }));

  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.lastMessageDirection, "outbound");
  assert.ok(contact.lastFollowUpAt);
});

test("groups and status broadcasts are skipped", async () => {
  await logInboundMessage(OWNER, waMessage({ id: "G1", remoteJid: "12345-6789@g.us" }));
  await logInboundMessage(OWNER, waMessage({ id: "S1", remoteJid: "status@broadcast" }));

  assert.equal(await Contact.countDocuments({ owner: OWNER }), 0);
  assert.equal(await Message.countDocuments({ owner: OWNER }), 0);
});

test("logHistoryMessages ingests a batch and returns the inserted count", async () => {
  const batch = [
    waMessage({ id: "H1", secondsAgo: 300, text: "Bonjour" }),
    waMessage({ id: "H2", secondsAgo: 200, fromMe: true, text: "Bonjour, dispo demain" }),
    waMessage({ id: "H3", secondsAgo: 100, text: "Merci" }),
  ];

  const inserted = await logHistoryMessages(OWNER, batch);

  assert.equal(inserted, 3);
  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.messageCount, 3);
  assert.equal(contact.lastMessageDirection, "inbound"); // H3, the most recent, is inbound
  assert.equal(contact.lastMessagePreview, "Merci");
  assert.ok(contact.lastFollowUpAt); // set by H2
});

test("logHistoryMessages does not regress lastMessageAt when batches arrive out of order", async () => {
  await logHistoryMessages(OWNER, [waMessage({ id: "NEW", secondsAgo: 10, text: "Message récent" })]);
  await logHistoryMessages(OWNER, [waMessage({ id: "OLD", secondsAgo: 5000, text: "Message ancien" })]);

  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.lastMessagePreview, "Message récent");
  assert.equal(contact.messageCount, 2);
});

test("logHistoryMessages does not double-count a message already seen live", async () => {
  const msg = waMessage({ id: "LIVE-1", text: "Déjà reçu en direct" });
  await logInboundMessage(OWNER, msg);
  const inserted = await logHistoryMessages(OWNER, [msg]);

  assert.equal(inserted, 0);
  const contact = await Contact.findOne({ owner: OWNER });
  assert.equal(contact.messageCount, 1);
});

test("logHistoryMessages skips groups and status broadcasts", async () => {
  const inserted = await logHistoryMessages(OWNER, [
    waMessage({ id: "GH1", remoteJid: "12345-6789@g.us" }),
    waMessage({ id: "SH1", remoteJid: "status@broadcast" }),
  ]);

  assert.equal(inserted, 0);
  assert.equal(await Contact.countDocuments({ owner: OWNER }), 0);
});
