# WhatsApp History Backfill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a vendor connects their WhatsApp, backfill their existing conversation history into `Contact`/`Message` instead of starting the CRM empty.

**Architecture:** `backend/src/whatsapp/manager.js` switches Baileys to `syncFullHistory: true` and listens for the `messaging-history.set` event (currently unhandled), feeding each historical batch into a new `logHistoryMessages` bulk-ingestion path in `messageIngest.js`. That path reuses the same contact/message primitives as the live path, after a correctness fix ensures rolling contact stats (`lastMessageAt`, `messageCount`, etc.) are only updated from genuinely-new, chronologically-newer messages — required because history arrives in per-chat chunks, not strictly oldest-to-newest across the whole sync. Sync progress is exposed via the existing `GET /api/whatsapp/status` endpoint and surfaced as a banner in `frontend/src/pages/Connect.jsx`.

**Tech Stack:** Node.js (ESM), Express, Mongoose, `@whiskeysockets/baileys`, React 18. Tests use Node's built-in `node:test` runner and the already-present `mongodb-memory-server` devDependency — no new dependencies.

## Global Constraints

- Backend is ESM (`"type": "module"`) — use `import`/`export` throughout, matching existing files.
- No test suite exists yet in this repo. This plan introduces one scoped to the logic that most needs regression protection (`messageIngest.js`), using only what's already installed (`mongodb-memory-server` is already a devDependency, used today by `npm run dev:memory`). Route/manager/frontend changes are verified manually, consistent with how the rest of this codebase is tested today.
- Every Mongo query must stay scoped by `owner` (project-wide convention — see `CLAUDE.md`).
- The WhatsApp connection remains read-only by design — do not add any `sock.sendMessage()` call anywhere in this plan.
- UI copy is in French, matching existing strings in `Connect.jsx`.
- **Deviation from the spec's literal wording**: `docs/superpowers/specs/2026-07-15-whatsapp-history-backfill-design.md` describes the bulk path using `Message.insertMany(..., { ordered: false })` and `Contact.bulkWrite`. This plan instead processes each history batch with a sequential per-message loop reusing the same `ensureContact`/`storeMessage`/`applyContactActivity` helpers as the live path. Reasoning: Baileys delivers history in bounded per-event chunks (not one multi-thousand-message array), so sequential processing per event stays responsive; the sequential approach is also far simpler to get correct (duplicate detection, out-of-order timestamps) and to unit test than reconciling `insertMany`'s partial-failure result shape with `Contact.bulkWrite`'s conditional updates. The outcome-level requirements from the spec (dedup safety, correct rolling stats, no regression on out-of-order arrival) are fully preserved.

---

## Task 1: Fix rolling contact stats to only update from genuinely-new messages

**Files:**
- Modify: `backend/src/services/messageIngest.js`
- Create: `backend/test/messageIngest.test.js`
- Modify: `backend/package.json` (add `test` script)

**Interfaces:**
- Consumes: `Contact` model (`backend/src/models/Contact.js`), `Message` model (`backend/src/models/Message.js`), `hasIntentSignal` (`backend/src/config/intentKeywords.js`) — all pre-existing, unchanged.
- Produces:
  - `isTrackableChat(waId: string): boolean` — exported, replaces the two duplicated inline checks.
  - `logInboundMessage(ownerId, waMessage): Promise<void>` — exported, same signature as before, behavior fixed.
  - `logOutboundMessage(ownerId, waMessage): Promise<void>` — exported, same signature as before, behavior fixed.
  - `ensureContact({ owner, waId, pushName }): Promise<Contact>` — internal (not exported), used by Task 2.
  - `storeMessage({ owner, contact, waMessage, direction, type, text, timestamp, intentSignal }): Promise<boolean>` — internal, now returns whether the message was actually inserted (`false` on duplicate `waMessageId`). Used by Task 2.
  - `applyContactActivity({ contact, direction, text, timestamp }): Promise<void>` — internal, used by Task 2.

This is a bug fix in existing behavior: today, `upsertContact` unconditionally sets `lastMessageAt`/`$inc messageCount` *before* knowing whether `storeMessage` will actually insert the message — so a message redelivered by Baileys on reconnect (already documented as a known case in this codebase) inflates `messageCount` even though the duplicate `Message` document is silently dropped.

- [ ] **Step 1: Write the failing test**

Create `backend/test/messageIngest.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Contact from "../src/models/Contact.js";
import Message from "../src/models/Message.js";
import { logInboundMessage, logOutboundMessage, isTrackableChat } from "../src/services/messageIngest.js";

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
  await logInboundMessage(OWNER, waMessage({ id: "IN1" }));
  await logOutboundMessage(OWNER, waMessage({ id: "OUT1", fromMe: true, text: "Merci, disponible demain" }));

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
```

Add a `test` script to `backend/package.json` (in `"scripts"`, alongside `dev`/`dev:memory`/`start`):

```json
"test": "node --test test/"
```

- [ ] **Step 2: Run the test to verify the redelivery test fails**

Run (from `backend/`): `npm test`

Expected: `isTrackableChat` fails with "not a function" (not yet exported), or once exported, the "redelivering the same waMessageId does not inflate messageCount" test FAILS with `messageCount` equal to `2` instead of `1`.

- [ ] **Step 3: Implement the fix**

Replace the body of `backend/src/services/messageIngest.js` from `function extractContent` onward (keep `extractContent`, `TYPE_LABELS`, `previewOf` unchanged) with:

```js
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

export { isTrackableChat };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all 5 tests in `messageIngest.test.js` PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messageIngest.js backend/test/messageIngest.test.js backend/package.json
git commit -m "fix: only update contact rolling stats from genuinely-new messages"
```

---

## Task 2: Bulk-ingest historical message batches

**Files:**
- Modify: `backend/src/services/messageIngest.js`
- Modify: `backend/test/messageIngest.test.js`

**Interfaces:**
- Consumes: `isTrackableChat`, `ensureContact`, `storeMessage`, `applyContactActivity`, `extractContent`, `hasIntentSignal` from Task 1 (same file, internal to the module except `isTrackableChat`).
- Produces: `logHistoryMessages(ownerId, waMessages: object[]): Promise<number>` — exported; processes a batch of raw Baileys `WAMessage` objects (as delivered by the `messaging-history.set` event) and returns the count of messages actually inserted (excludes duplicates and skipped chats). Consumed by Task 4.

- [ ] **Step 1: Write the failing tests**

Append to `backend/test/messageIngest.test.js` (add `logHistoryMessages` to the existing import from `../src/services/messageIngest.js`):

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with `logHistoryMessages is not a function` (not yet defined/exported).

- [ ] **Step 3: Implement `logHistoryMessages`**

Add to `backend/src/services/messageIngest.js`, after `logOutboundMessage` (and add `logHistoryMessages` to the `export { isTrackableChat }` line, or export inline like the other two functions):

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests in `messageIngest.test.js` PASS (9 total).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/messageIngest.js backend/test/messageIngest.test.js
git commit -m "feat: add bulk history-message ingestion path"
```

---

## Task 3: Expose history-sync state on the User model and status route

**Files:**
- Modify: `backend/src/models/User.js:23-32`
- Modify: `backend/src/routes/whatsapp.js:13-20`
- Modify: `backend/test/messageIngest.test.js` (add one model default-values test)

**Interfaces:**
- Produces:
  - `User.whatsapp.historySyncStatus: "idle" | "syncing" | "complete"` (default `"idle"`)
  - `User.whatsapp.historySyncedCount: number` (default `0`)
  - `GET /api/whatsapp/status` response gains `historySyncStatus` and `historySyncedCount` fields.
- Consumed by Task 4 (manager.js writes these fields) and Task 5 (frontend reads them).

- [ ] **Step 1: Write the failing test**

Append to `backend/test/messageIngest.test.js` (add `import User from "../src/models/User.js";` near the other model imports):

```js
test("User whatsapp history-sync fields default to idle/0", async () => {
  const user = await User.create({
    businessName: "Boutique Test",
    email: `test-${Date.now()}@example.com`,
    passwordHash: "irrelevant-for-this-test",
  });

  assert.equal(user.whatsapp.historySyncStatus, "idle");
  assert.equal(user.whatsapp.historySyncedCount, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `user.whatsapp.historySyncStatus` is `undefined` (field doesn't exist on the schema yet).

- [ ] **Step 3: Add the schema fields**

In `backend/src/models/User.js`, replace the `whatsapp` block (lines 23-32):

```js
    whatsapp: {
      status: {
        type: String,
        enum: ["disconnected", "connecting", "connected"],
        default: "disconnected",
      },
      phoneNumber: { type: String },
      lastConnectedAt: { type: Date },
      lastDisconnectedAt: { type: Date },
      historySyncStatus: {
        type: String,
        enum: ["idle", "syncing", "complete"],
        default: "idle",
      },
      historySyncedCount: { type: Number, default: 0 },
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all tests PASS (10 total).

- [ ] **Step 5: Expose the fields on the status route**

In `backend/src/routes/whatsapp.js`, replace the `GET /status` handler (lines 13-20):

```js
router.get("/status", requireAuth, async (req, res) => {
  res.json({
    status: whatsAppManager.getStatus(req.user._id),
    phoneNumber: req.user.whatsapp.phoneNumber || null,
    lastConnectedAt: req.user.whatsapp.lastConnectedAt || null,
    lastDisconnectedAt: req.user.whatsapp.lastDisconnectedAt || null,
    historySyncStatus: req.user.whatsapp.historySyncStatus || "idle",
    historySyncedCount: req.user.whatsapp.historySyncedCount || 0,
  });
});
```

- [ ] **Step 6: Manually verify the route**

Run: `npm run dev:memory` (from `backend/`), then in another terminal, register a user and check status:

```bash
curl -s -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"businessName":"Test","email":"test@example.com","password":"password123"}'
# copy the "token" field from the response, then:
curl -s http://localhost:4000/api/whatsapp/status -H "Authorization: Bearer <token>"
```

Expected: JSON response includes `"historySyncStatus":"idle","historySyncedCount":0`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/User.js backend/src/routes/whatsapp.js backend/test/messageIngest.test.js
git commit -m "feat: add historySyncStatus/historySyncedCount to User and status route"
```

---

## Task 4: Wire Baileys history sync into the connection manager

**Files:**
- Modify: `backend/src/whatsapp/manager.js`

**Interfaces:**
- Consumes: `logHistoryMessages(ownerId, waMessages): Promise<number>` (Task 2), `User.whatsapp.historySyncStatus`/`historySyncedCount` (Task 3).
- Produces: no new exported signatures — internal session state `session.historySync: { status: "idle"|"syncing"|"complete", count: number }` and the corresponding persisted `User.whatsapp` fields, kept in sync at runtime.

This task has no automated test (it requires a live Baileys socket/real WhatsApp connection to exercise) — verify manually per Step 3.

- [ ] **Step 1: Update the import and `syncFullHistory` flag**

In `backend/src/whatsapp/manager.js`, change the import line:

```js
import { logInboundMessage, logOutboundMessage, logHistoryMessages } from "../services/messageIngest.js";
```

Change `syncFullHistory: false` to `syncFullHistory: true` in the `makeWASocket(...)` call.

- [ ] **Step 2: Add history-sync state tracking and the `messaging-history.set` listener**

Replace the body of `async start(userId)` in `backend/src/whatsapp/manager.js` with:

```js
  async start(userId) {
    const key = String(userId);
    if (this.sessions.get(key)?.status === "connected") return;

    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir(key));
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      syncFullHistory: true,
      markOnlineOnConnect: false,
    });

    this.sessions.set(key, { sock, qr: null, status: "connecting", historySync: { status: "idle", count: 0 } });
    await User.findByIdAndUpdate(key, {
      "whatsapp.status": "connecting",
      "whatsapp.historySyncStatus": "idle",
      "whatsapp.historySyncedCount": 0,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const session = this.sessions.get(key);
      const { connection, lastDisconnect, qr } = update;

      if (qr && session) {
        session.qr = qr;
        session.status = "connecting";
      }

      if (connection === "open") {
        const phoneNumber = sock.user?.id?.split(":")[0] || null;
        if (session) {
          session.status = "connected";
          session.qr = null;
          session.historySync = { status: "syncing", count: 0 };
        }
        await User.findByIdAndUpdate(key, {
          "whatsapp.status": "connected",
          "whatsapp.phoneNumber": phoneNumber,
          "whatsapp.lastConnectedAt": new Date(),
          "whatsapp.historySyncStatus": "syncing",
          "whatsapp.historySyncedCount": 0,
        });
        console.log(`[wa:${key}] connected as ${phoneNumber}`);

        // Safety net: a brand-new number (or a flaky sync) may never send a
        // final history chunk — don't leave the UI stuck on "importing"
        // forever if that happens.
        setTimeout(async () => {
          const current = this.sessions.get(key);
          if (current?.historySync?.status === "syncing") {
            current.historySync.status = "complete";
            await User.findByIdAndUpdate(key, { "whatsapp.historySyncStatus": "complete" }).catch(() => {});
          }
        }, 2 * 60 * 1000);
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (session) session.status = "disconnected";
        await User.findByIdAndUpdate(key, {
          "whatsapp.status": "disconnected",
          "whatsapp.lastDisconnectedAt": new Date(),
        });
        console.warn(`[wa:${key}] connection closed (loggedOut=${loggedOut})`);

        if (loggedOut) {
          this.sessions.delete(key);
          fs.rmSync(this.sessionDir(key), { recursive: true, force: true });
        } else {
          // transient drop (network, phone offline...) — attempt one reconnect
          this.sessions.delete(key);
          setTimeout(() => this.start(key).catch((err) => console.error(`[wa:${key}] reconnect failed`, err)), 3000);
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const msg of messages) {
        try {
          if (msg.key.fromMe) {
            await logOutboundMessage(key, msg);
          } else {
            await logInboundMessage(key, msg);
          }
        } catch (err) {
          console.error(`[wa:${key}] failed to log message`, err);
        }
      }
    });

    sock.ev.on("messaging-history.set", async ({ messages, isLatest }) => {
      const session = this.sessions.get(key);
      try {
        const inserted = await logHistoryMessages(key, messages);
        if (session) {
          session.historySync = session.historySync || { status: "syncing", count: 0 };
          session.historySync.count += inserted;
          if (isLatest) session.historySync.status = "complete";
        }
        await User.findByIdAndUpdate(key, {
          "whatsapp.historySyncedCount": session?.historySync.count ?? inserted,
          ...(isLatest ? { "whatsapp.historySyncStatus": "complete" } : {}),
        });
      } catch (err) {
        console.error(`[wa:${key}] failed to log history batch`, err);
      }
    });

    return sock;
  }
```

- [ ] **Step 3: Reset history-sync state on disconnect**

Replace the `async stop(userId)` method in `backend/src/whatsapp/manager.js` with:

```js
  async stop(userId) {
    const key = String(userId);
    const session = this.sessions.get(key);
    if (session?.sock) {
      await session.sock.logout().catch(() => {});
    }
    this.sessions.delete(key);
    fs.rmSync(this.sessionDir(key), { recursive: true, force: true });
    await User.findByIdAndUpdate(key, {
      "whatsapp.status": "disconnected",
      "whatsapp.historySyncStatus": "idle",
      "whatsapp.historySyncedCount": 0,
    });
  }
```

- [ ] **Step 4: Manually verify**

1. Run `npm run dev:memory` from `backend/`.
2. Log in through the frontend (or via the `/whatsapp` page once Task 5 is done) and connect a real WhatsApp account with existing conversation history.
3. Scan the QR code.
4. Watch the backend console: confirm no errors logged from the `messaging-history.set` handler.
5. Query the in-memory Mongo (or add a temporary `console.log` in the handler) to confirm `Contact`/`Message` documents accumulate progressively.
6. Poll `GET /api/whatsapp/status` (or watch it once Task 5's banner exists) and confirm `historySyncStatus` moves from `"syncing"` to `"complete"`, and `historySyncedCount` increases monotonically.
7. Confirm no duplicate `waMessageId` documents exist for the owner (`db.messages.aggregate([{$match:{owner: ObjectId("...")}}, {$group:{_id:"$waMessageId", n:{$sum:1}}}, {$match:{n:{$gt:1}}}])` should return nothing).
8. Open the Suggestions and Analytics pages (no code in `suggestionEngine.js`/`analyticsEngine.js` changes in this plan) and confirm they already reflect the imported contacts/messages — proves the backfill integrates without touching downstream features.
9. Disconnect via the UI (or `POST /api/whatsapp/disconnect`) and confirm `GET /api/whatsapp/status` shows `historySyncStatus: "idle"`, `historySyncedCount: 0` again.

- [ ] **Step 5: Commit**

```bash
git add backend/src/whatsapp/manager.js
git commit -m "feat: backfill WhatsApp history via messaging-history.set"
```

---

## Task 5: Show an import-in-progress banner on the Connect page

**Files:**
- Modify: `frontend/src/pages/Connect.jsx`

**Interfaces:**
- Consumes: `historySyncStatus`, `historySyncedCount` fields from `GET /whatsapp/status` (Task 3/4).

No automated frontend test infra exists in this repo; verify manually in the browser per Step 2 (consistent with `CLAUDE.md`'s guidance to test UI changes in a running browser).

- [ ] **Step 1: Add the banner**

In `frontend/src/pages/Connect.jsx`:

Add two more `useState` calls alongside the existing ones (after `const [phoneNumber, setPhoneNumber] = useState(null);`):

```js
  const [historySyncStatus, setHistorySyncStatus] = useState("idle");
  const [historySyncedCount, setHistorySyncedCount] = useState(0);
```

In the `poll` callback, after `setPhoneNumber(s.phoneNumber);`, add:

```js
    setHistorySyncStatus(s.historySyncStatus || "idle");
    setHistorySyncedCount(s.historySyncedCount || 0);
```

After the existing status banner `<div className="status-banner">...</div>` block (and before the `{status === "connecting" && (...)}` block), add:

```jsx
      {status === "connected" && historySyncStatus === "syncing" && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%" }} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>
            Import de l'historique en cours… ({historySyncedCount} message{historySyncedCount > 1 ? "s" : ""} importé
            {historySyncedCount > 1 ? "s" : ""})
          </p>
        </div>
      )}
```

- [ ] **Step 2: Manually verify in the browser**

1. Run `npm run dev:memory` in `backend/` and `npm run dev` in `frontend/`.
2. Log in, go to `/whatsapp` (the `Connect` page), connect a WhatsApp account with history.
3. Confirm the "Import de l'historique en cours…" banner appears right after the status flips to "Connecté", with the message count increasing over the following polls (every 3s).
4. Confirm the banner disappears once the sync completes (or after the 2-minute safety timeout for a number with no history).
5. Confirm the existing "Relance ne fait jamais d'envoi automatique…" trust banner still renders unchanged below.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Connect.jsx
git commit -m "feat: show history import progress banner on the Connect page"
```
