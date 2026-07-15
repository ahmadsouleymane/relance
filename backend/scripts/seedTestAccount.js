// Fills a single test account with every plan feature unlocked and enough
// fake data (contacts, messages, tags, products, invoices) to click through
// the whole product end-to-end. Never run this against a real vendor's data
// — it deletes any prior data for TEST_EMAIL before reseeding.
import User from "../src/models/User.js";
import Contact from "../src/models/Contact.js";
import Message from "../src/models/Message.js";
import Tag from "../src/models/Tag.js";
import Product from "../src/models/Product.js";
import Invoice from "../src/models/Invoice.js";
import { slugify } from "../src/utils/slugify.js";
import { hasIntentSignal } from "../src/config/intentKeywords.js";
import { computeLeadScore } from "../src/services/leadScoring.js";

export const TEST_EMAIL = "test@relance.ci";
export const TEST_PASSWORD = "password123";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS);

const FIRST_NAMES = ["Awa", "Kouassi", "Fatou", "Yao", "Aminata", "Bakary", "Adjoua", "Moussa", "Aya", "Ibrahim", "Nadege", "Serge", "Mariam", "Konan", "Sekou"];
const LAST_NAMES = ["Kone", "Traore", "Ouattara", "Diabate", "Coulibaly", "Bamba", "Yao", "Kouame", "Toure", "N'Guessan"];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function fakePhoneNumber(index) {
  return `2250700${String(100000 + index).slice(-6)}`;
}

async function upsertTag(owner, label, color) {
  return Tag.findOneAndUpdate({ owner, label }, { owner, label, color }, { upsert: true, new: true });
}

const CONTACT_SEEDS = [
  { status: "nouveau", silenceDays: 0.5, tag: "Nouveau", intent: false },
  { status: "nouveau", silenceDays: 1.5, tag: "Nouveau", intent: true },
  { status: "en_negociation", silenceDays: 2, tag: "En negociation", intent: true },
  { status: "en_negociation", silenceDays: 4, tag: "En negociation", intent: true },
  { status: "en_negociation", silenceDays: 8, tag: "Relance urgente", intent: false },
  { status: "client", silenceDays: 0.2, tag: "VIP", intent: false, resolved: true },
  { status: "client", silenceDays: 15, tag: "VIP", intent: false, resolved: true },
  { status: "client", silenceDays: 30, tag: "Grossiste", intent: false, resolved: true },
  { status: "perdu", silenceDays: 45, tag: "Perdu", intent: false, resolved: true },
  { status: "perdu", silenceDays: 60, tag: "Perdu", intent: false, resolved: true },
  { status: "nouveau", silenceDays: 0.1, tag: "Nouveau", intent: true },
  { status: "en_negociation", silenceDays: 6, tag: "Relance urgente", intent: true },
  { status: "client", silenceDays: 3, tag: "VIP", intent: false, resolved: true },
  { status: "nouveau", silenceDays: 9, tag: "Relance urgente", intent: false },
  { status: "en_negociation", silenceDays: 1, tag: "En negociation", intent: false },
];

const PRODUCT_SEEDS = [
  { name: "Pagne wax 6 yards", price: 15000, stock: 24, status: "disponible" },
  { name: "Sac a main cuir", price: 25000, stock: 6, status: "disponible" },
  { name: "Baskets homme running", price: 18000, stock: 0, status: "rupture" },
  { name: "Robe soiree brodee", price: 32000, stock: 3, status: "disponible" },
  { name: "Bijoux perles artisanales", price: 8000, stock: 40, status: "disponible" },
  { name: "Chemise homme lin", price: 12000, stock: 15, status: "disponible" },
  { name: "Sandales cuir femme", price: 14000, stock: null, status: "disponible" },
  { name: "Ancienne collection foulards", price: 6000, stock: 0, status: "archive" },
];

const MESSAGE_TEMPLATES_IN = [
  "Bonjour, c'est combien le prix ?",
  "Vous etes dispo pour livraison demain ?",
  "Je veux commander 2 pieces",
  "Il reste du stock ?",
  "Merci beaucoup, a bientot",
  "C'est bon je passe ce soir",
  "Vous acceptez Orange Money ?",
  "Bonsoir, vous etes ouverts demain ?",
];
const MESSAGE_TEMPLATES_OUT = [
  "Bonjour, oui c'est 15000 FCFA",
  "Oui on livre a Cocody et Yopougon",
  "Parfait, je vous envoie la facture",
  "Oui il reste 3 pieces en stock",
  "Merci a vous, a bientot !",
  "Ok on vous attend",
  "Oui, Orange Money et Wave acceptes",
];

async function seedContactsAndMessages(owner, tagsByLabel) {
  let totalMessages = 0;

  for (let i = 0; i < CONTACT_SEEDS.length; i++) {
    const seed = CONTACT_SEEDS[i];
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const phoneNumber = fakePhoneNumber(i);
    const waId = `${phoneNumber}@s.whatsapp.net`;

    const messageCount = 3 + Math.floor(Math.random() * 5);
    const lastMessageAt = daysAgo(seed.silenceDays);
    const spanDays = 20 + Math.random() * 20;

    const messages = [];
    for (let m = 0; m < messageCount; m++) {
      const isLast = m === messageCount - 1;
      const direction = isLast ? "inbound" : m % 2 === 0 ? "inbound" : "outbound";
      const timestamp = isLast
        ? lastMessageAt
        : new Date(lastMessageAt.getTime() - (messageCount - m) * ((spanDays * DAY_MS) / messageCount));
      const text =
        direction === "inbound"
          ? seed.intent && isLast
            ? randomFrom(MESSAGE_TEMPLATES_IN.filter((t) => hasIntentSignal(t)))
            : randomFrom(MESSAGE_TEMPLATES_IN)
          : randomFrom(MESSAGE_TEMPLATES_OUT);

      messages.push({
        owner,
        waMessageId: `seed-${i}-${m}`,
        direction,
        type: "text",
        text,
        hasIntentSignal: direction === "inbound" && hasIntentSignal(text),
        timestamp,
      });
    }

    const contact = await Contact.create({
      owner,
      waId,
      phoneNumber,
      displayName: `${firstName} ${lastName}`,
      pushName: firstName,
      tags: tagsByLabel[seed.tag] ? [tagsByLabel[seed.tag]._id] : [],
      status: seed.status,
      lastMessageAt,
      lastMessageDirection: "inbound",
      lastMessagePreview: messages[messages.length - 1].text,
      lastFollowUpAt: seed.resolved ? new Date(lastMessageAt.getTime() + 60 * 60 * 1000) : undefined,
      messageCount,
    });

    for (const msg of messages) {
      await Message.create({ ...msg, contact: contact._id });
    }
    totalMessages += messages.length;

    const recentMessages = messages.map((m) => ({ direction: m.direction, timestamp: m.timestamp, hasIntentSignal: m.hasIntentSignal }));
    const { score } = computeLeadScore(contact, recentMessages);
    contact.leadScore = score;
    await contact.save();
  }

  return totalMessages;
}

async function seedProducts(owner) {
  for (const p of PRODUCT_SEEDS) {
    await Product.findOneAndUpdate(
      { owner, slug: slugify(p.name) },
      { owner, name: p.name, price: p.price, stock: p.stock, status: p.status, slug: slugify(p.name), description: `${p.name} — article de demonstration.` },
      { upsert: true, new: true }
    );
  }
}

async function seedInvoices(owner) {
  const contacts = await Contact.find({ owner }).limit(5);
  const statuses = ["draft", "sent", "paid", "paid", "sent"];
  for (let i = 0; i < contacts.length; i++) {
    const qty = 1 + Math.floor(Math.random() * 3);
    const unitPrice = 5000 + Math.floor(Math.random() * 5) * 5000;
    const items = [{ label: `Article demo ${i + 1}`, qty, unitPrice }];
    await Invoice.create({
      owner,
      contact: contacts[i]._id,
      items,
      total: qty * unitPrice,
      status: statuses[i],
    });
  }
}

export async function seedTestAccount() {
  const existing = await User.findOne({ email: TEST_EMAIL });
  if (existing) {
    await Promise.all([
      Contact.deleteMany({ owner: existing._id }),
      Message.deleteMany({ owner: existing._id }),
      Tag.deleteMany({ owner: existing._id }),
      Product.deleteMany({ owner: existing._id }),
      Invoice.deleteMany({ owner: existing._id }),
    ]);
    await existing.deleteOne();
  }

  const user = new User({
    businessName: "Boutique Demo Test",
    email: TEST_EMAIL,
    phone: "0700000000",
    storeSlug: "boutique-demo-test",
    plan: {
      id: "business",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 365 * DAY_MS),
    },
    whatsapp: {
      status: "connected",
      phoneNumber: "225070000000",
      lastConnectedAt: daysAgo(1),
      historySyncStatus: "complete",
      historySyncedCount: 0,
    },
  });
  await user.setPassword(TEST_PASSWORD);
  await user.save();

  const tagDefs = [
    { label: "Nouveau", color: "#3b82f6" },
    { label: "En negociation", color: "#f5a524" },
    { label: "Relance urgente", color: "#ef4444" },
    { label: "VIP", color: "#8b5cf6" },
    { label: "Grossiste", color: "#10b981" },
    { label: "Perdu", color: "#6b7280" },
  ];
  const tagsByLabel = {};
  for (const t of tagDefs) {
    tagsByLabel[t.label] = await upsertTag(user._id, t.label, t.color);
  }

  const totalMessages = await seedContactsAndMessages(user._id, tagsByLabel);
  await seedProducts(user._id);
  await seedInvoices(user._id);

  user.whatsapp.historySyncedCount = totalMessages;
  await user.save();

  return {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    userId: String(user._id),
    contacts: CONTACT_SEEDS.length,
    messages: totalMessages,
    products: PRODUCT_SEEDS.length,
  };
}

// Allow running standalone: `node scripts/seedTestAccount.js` against MONGODB_URI.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: dotenv } = await import("dotenv");
  dotenv.config();
  const { connectDB } = await import("../src/config/db.js");
  await connectDB();
  const result = await seedTestAccount();
  console.log("[seed] test account ready:", result);
  process.exit(0);
}
