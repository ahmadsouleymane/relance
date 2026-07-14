import cron from "node-cron";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import Message from "../models/Message.js";
import { computeLeadScore } from "../services/leadScoring.js";
import { buildWeeklyDigest } from "../services/weeklyDigest.js";
import { sendWeeklyDigestEmail } from "../services/emailDigest.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30; // must match leadScoring.js's own lookback window

async function recomputeLeadScoresForOwner(ownerId) {
  const cutoff = new Date(Date.now() - WINDOW_DAYS * DAY_MS);
  const [contacts, messages] = await Promise.all([
    Contact.find({ owner: ownerId }),
    Message.find({ owner: ownerId, timestamp: { $gte: cutoff } }),
  ]);

  const messagesByContact = new Map();
  for (const m of messages) {
    const key = m.contact.toString();
    if (!messagesByContact.has(key)) messagesByContact.set(key, []);
    messagesByContact.get(key).push(m);
  }

  const bulkOps = contacts.map((contact) => {
    const { score } = computeLeadScore(contact, messagesByContact.get(contact._id.toString()) || []);
    return { updateOne: { filter: { _id: contact._id }, update: { $set: { leadScore: score } } } };
  });
  if (bulkOps.length) await Contact.bulkWrite(bulkOps);
}

export async function runWeeklyDigestJob() {
  const users = await User.find({});
  for (const user of users) {
    await recomputeLeadScoresForOwner(user._id);
    const digest = await buildWeeklyDigest(user._id);

    if (!process.env.RESEND_API_KEY) continue; // not configured yet — in-app digest still works via GET /api/digest/weekly

    try {
      await sendWeeklyDigestEmail(user, digest);
    } catch (err) {
      console.error(`[weekly-digest] failed to email ${user.email}`, err);
    }
  }
}

export function scheduleWeeklyDigestJob() {
  // Monday 8am — Abidjan is UTC with no DST, so this is already local time
  // (same reasoning as the $hour aggregation in analyticsEngine.js).
  cron.schedule("0 8 * * 1", () => {
    runWeeklyDigestJob().catch((err) => console.error("[weekly-digest] job failed", err));
  });
}
