import Contact from "../models/Contact.js";
import Message from "../models/Message.js";
import { hasIntentSignal } from "../config/intentKeywords.js";

const TYPE_LABELS = {
  conversation: "text",
  extendedTextMessage: "text",
  imageMessage: "image",
  videoMessage: "video",
  audioMessage: "audio",
  documentMessage: "document",
  stickerMessage: "sticker",
  locationMessage: "location",
};

function extractContent(waMessage) {
  const content = waMessage.message;
  if (!content) return { type: "other", text: "" };

  const key = Object.keys(TYPE_LABELS).find((k) => content[k]);
  if (!key) return { type: "other", text: "" };

  const type = TYPE_LABELS[key];
  let text = "";
  if (key === "conversation") text = content.conversation || "";
  else if (key === "extendedTextMessage") text = content.extendedTextMessage?.text || "";
  else if (["imageMessage", "videoMessage", "documentMessage"].includes(key)) {
    text = content[key]?.caption || `[${type}]`;
  } else {
    text = `[${type}]`;
  }

  return { type, text };
}

function previewOf(text, max = 120) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

async function upsertContact({ owner, waId, direction, pushName, text, timestamp }) {
  const phoneNumber = waId.split("@")[0];

  const contact = await Contact.findOneAndUpdate(
    { owner, waId },
    {
      $setOnInsert: { owner, waId, phoneNumber, displayName: pushName || phoneNumber },
      $set: {
        ...(pushName ? { pushName } : {}),
        lastMessageAt: timestamp,
        lastMessageDirection: direction,
        lastMessagePreview: previewOf(text),
      },
      $inc: { messageCount: 1 },
    },
    { upsert: true, new: true }
  );

  return contact;
}

async function storeMessage({ owner, contact, waMessage, direction, type, text, timestamp, intentSignal }) {
  try {
    await Message.create({
      owner,
      contact: contact._id,
      waMessageId: waMessage.key.id,
      direction,
      type,
      text,
      hasIntentSignal: intentSignal,
      timestamp,
    });
  } catch (err) {
    // duplicate waMessageId for this owner (e.g. Baileys redelivering on reconnect) — safe to ignore
    if (err.code !== 11000) throw err;
  }
}

export async function logInboundMessage(ownerId, waMessage) {
  const waId = waMessage.key.remoteJid;
  if (!waId || waId.endsWith("@g.us") || waId === "status@broadcast") return; // skip groups/status for MVP

  const { type, text } = extractContent(waMessage);
  const timestamp = new Date(Number(waMessage.messageTimestamp) * 1000);
  const pushName = waMessage.pushName;

  const contact = await upsertContact({
    owner: ownerId,
    waId,
    direction: "inbound",
    pushName,
    text,
    timestamp,
  });

  await storeMessage({
    owner: ownerId,
    contact,
    waMessage,
    direction: "inbound",
    type,
    text,
    timestamp,
    intentSignal: hasIntentSignal(text),
  });
}

export async function logOutboundMessage(ownerId, waMessage) {
  const waId = waMessage.key.remoteJid;
  if (!waId || waId.endsWith("@g.us") || waId === "status@broadcast") return;

  const { type, text } = extractContent(waMessage);
  const timestamp = new Date(Number(waMessage.messageTimestamp) * 1000);

  const contact = await upsertContact({
    owner: ownerId,
    waId,
    direction: "outbound",
    pushName: null,
    text,
    timestamp,
  });

  // A manual reply resolves any pending follow-up suggestion for this contact.
  contact.lastFollowUpAt = timestamp;
  await contact.save();

  await storeMessage({ owner: ownerId, contact, waMessage, direction: "outbound", type, text, timestamp });
}
