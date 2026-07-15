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

function isTrackableChat(waId) {
  return Boolean(waId) && !waId.endsWith("@g.us") && waId !== "status@broadcast";
}

async function ensureContact({ owner, waId, pushName }) {
  const phoneNumber = waId.split("@")[0];

  return Contact.findOneAndUpdate(
    { owner, waId },
    {
      $setOnInsert: { owner, waId, phoneNumber, displayName: pushName || phoneNumber },
      ...(pushName ? { $set: { pushName } } : {}),
    },
    { upsert: true, new: true }
  );
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
    return true;
  } catch (err) {
    // duplicate waMessageId for this owner (e.g. Baileys redelivering on reconnect) — safe to ignore
    if (err.code !== 11000) throw err;
    return false;
  }
}

// Only called after storeMessage confirms a genuinely new message, and only
// moves lastMessageAt/lastFollowUpAt forward — never backward — because
// history batches (Task 2) don't arrive in strict chronological order.
async function applyContactActivity({ contact, direction, text, timestamp }) {
  const isNewerMessage = { $or: [{ $eq: ["$lastMessageAt", null] }, { $lt: ["$lastMessageAt", timestamp] }] };
  const isNewerFollowUp = { $or: [{ $eq: ["$lastFollowUpAt", null] }, { $lt: ["$lastFollowUpAt", timestamp] }] };

  await Contact.updateOne({ _id: contact._id }, [
    {
      $set: {
        lastMessageAt: { $cond: [isNewerMessage, timestamp, "$lastMessageAt"] },
        lastMessageDirection: { $cond: [isNewerMessage, direction, "$lastMessageDirection"] },
        lastMessagePreview: { $cond: [isNewerMessage, previewOf(text), "$lastMessagePreview"] },
        messageCount: { $add: [{ $ifNull: ["$messageCount", 0] }, 1] },
        ...(direction === "outbound"
          ? { lastFollowUpAt: { $cond: [isNewerFollowUp, timestamp, "$lastFollowUpAt"] } }
          : {}),
      },
    },
  ]);
}

export async function logInboundMessage(ownerId, waMessage) {
  const waId = waMessage.key.remoteJid;
  if (!isTrackableChat(waId)) return;

  const { type, text } = extractContent(waMessage);
  const timestamp = new Date(Number(waMessage.messageTimestamp) * 1000);
  const pushName = waMessage.pushName;

  const contact = await ensureContact({ owner: ownerId, waId, pushName });
  const inserted = await storeMessage({
    owner: ownerId,
    contact,
    waMessage,
    direction: "inbound",
    type,
    text,
    timestamp,
    intentSignal: hasIntentSignal(text),
  });

  if (inserted) {
    await applyContactActivity({ contact, direction: "inbound", text, timestamp });
  }
}

export async function logOutboundMessage(ownerId, waMessage) {
  const waId = waMessage.key.remoteJid;
  if (!isTrackableChat(waId)) return;

  const { type, text } = extractContent(waMessage);
  const timestamp = new Date(Number(waMessage.messageTimestamp) * 1000);

  const contact = await ensureContact({ owner: ownerId, waId, pushName: null });
  const inserted = await storeMessage({ owner: ownerId, contact, waMessage, direction: "outbound", type, text, timestamp });

  if (inserted) {
    await applyContactActivity({ contact, direction: "outbound", text, timestamp });
  }
}

export async function logHistoryMessages(ownerId, waMessages) {
  let insertedCount = 0;

  for (const waMessage of waMessages) {
    const waId = waMessage.key?.remoteJid;
    if (!isTrackableChat(waId)) continue;

    const { type, text } = extractContent(waMessage);
    const timestamp = new Date(Number(waMessage.messageTimestamp) * 1000);
    const direction = waMessage.key.fromMe ? "outbound" : "inbound";
    const pushName = direction === "inbound" ? waMessage.pushName : null;

    const contact = await ensureContact({ owner: ownerId, waId, pushName });
    const inserted = await storeMessage({
      owner: ownerId,
      contact,
      waMessage,
      direction,
      type,
      text,
      timestamp,
      intentSignal: direction === "inbound" ? hasIntentSignal(text) : false,
    });

    if (inserted) {
      insertedCount += 1;
      await applyContactActivity({ contact, direction, text, timestamp });
    }
  }

  return insertedCount;
}

export { isTrackableChat };
