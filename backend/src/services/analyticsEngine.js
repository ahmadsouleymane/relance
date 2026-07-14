import Contact from "../models/Contact.js";
import Message from "../models/Message.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_ORDER = ["nouveau", "en_negociation", "client", "perdu"];
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]; // $dayOfWeek: 1 = Sunday

export async function getFunnel(ownerId) {
  const rows = await Contact.aggregate([
    { $match: { owner: ownerId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return STATUS_ORDER.map((status) => ({ status, count: counts[status] || 0 }));
}

export async function getTopTags(ownerId, limit = 10) {
  return Contact.aggregate([
    { $match: { owner: ownerId } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: "tags", localField: "_id", foreignField: "_id", as: "tag" } },
    { $unwind: "$tag" },
    { $project: { _id: 0, label: "$tag.label", color: "$tag.color", count: 1 } },
  ]);
}

// "When do clients write to me" — scoped to inbound only, that's the actionable signal.
// Abidjan is UTC with no DST, so $hour in UTC is already local hour.
export async function getMessagingActivity(ownerId) {
  const [byHourRows, byDayRows] = await Promise.all([
    Message.aggregate([
      { $match: { owner: ownerId, direction: "inbound" } },
      { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
    ]),
    Message.aggregate([
      { $match: { owner: ownerId, direction: "inbound" } },
      { $group: { _id: { $dayOfWeek: "$timestamp" }, count: { $sum: 1 } } },
    ]),
  ]);

  const byHourCounts = Object.fromEntries(byHourRows.map((r) => [r._id, r.count]));
  const byDayCounts = Object.fromEntries(byDayRows.map((r) => [r._id, r.count]));

  const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: byHourCounts[hour] || 0 }));
  const byDay = DAY_LABELS.map((label, i) => ({ day: label, count: byDayCounts[i + 1] || 0 }));

  return { byHour, byDay };
}

export async function getTopContacts(ownerId, limit = 10) {
  return Contact.find({ owner: ownerId })
    .sort({ messageCount: -1 })
    .limit(limit)
    .select("displayName phoneNumber messageCount lastMessageAt");
}

// Average delay between a client's message and the vendor's next reply.
// Done as an in-app pairing pass over a bounded window rather than a
// $setWindowFields aggregation — simpler to read/debug and plenty efficient
// at single-vendor MVP scale (a few tens of thousands of messages, at most).
export async function getAvgResponseTime(ownerId, { windowDays = 90 } = {}) {
  const since = new Date(Date.now() - windowDays * DAY_MS);

  const messages = await Message.find({ owner: ownerId, timestamp: { $gte: since } })
    .sort({ contact: 1, timestamp: 1 })
    .select("contact direction timestamp");

  let prev = null;
  let totalMs = 0;
  let count = 0;

  for (const m of messages) {
    if (prev && String(prev.contact) === String(m.contact) && prev.direction === "inbound" && m.direction === "outbound") {
      totalMs += m.timestamp - prev.timestamp;
      count++;
    }
    prev = m;
  }

  return count ? { avgMinutes: Math.round(totalMs / count / 60000), sampleSize: count } : { avgMinutes: null, sampleSize: 0 };
}
