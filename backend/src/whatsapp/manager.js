import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pino from "pino";
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import User from "../models/User.js";
import { logInboundMessage, logOutboundMessage, logHistoryMessages } from "../services/messageIngest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_ROOT = path.join(__dirname, "..", "..", "data", "wa-sessions");

const logger = pino({ level: "silent" });

/**
 * IMPORTANT — this connection is READ-ONLY BY DESIGN.
 * We never call sock.sendMessage() anywhere in this codebase. Baileys is an
 * unofficial protocol client; using it to send bulk/automated messages is
 * what triggers WhatsApp bans (often permanent, no appeal). We only listen
 * to the user's own conversations to build history, contacts and follow-up
 * suggestions — the vendor still sends every message by hand from their phone.
 * Do not add a send path here without re-reading that tradeoff.
 */
class WhatsAppManager {
  constructor() {
    /** @type {Map<string, { sock: import("@whiskeysockets/baileys").WASocket, qr: string|null, status: string }>} */
    this.sessions = new Map();
    fs.mkdirSync(AUTH_ROOT, { recursive: true });
  }

  sessionDir(userId) {
    return path.join(AUTH_ROOT, String(userId));
  }

  getStatus(userId) {
    return this.sessions.get(String(userId))?.status || "disconnected";
  }

  getQr(userId) {
    return this.sessions.get(String(userId))?.qr || null;
  }

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
        const historySyncTimeout = setTimeout(async () => {
          const current = this.sessions.get(key);
          if (current?.historySync?.status === "syncing") {
            current.historySync.status = "complete";
            await User.findByIdAndUpdate(key, { "whatsapp.historySyncStatus": "complete" }).catch(() => {});
          }
        }, 2 * 60 * 1000);
        if (session) session.historySyncTimeout = historySyncTimeout;
      }

      if (connection === "close") {
        if (session?.historySyncTimeout) clearTimeout(session.historySyncTimeout);

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

  async stop(userId) {
    const key = String(userId);
    const session = this.sessions.get(key);
    if (session?.sock) {
      await session.sock.logout().catch(() => {});
    }
    if (session?.historySyncTimeout) clearTimeout(session.historySyncTimeout);
    this.sessions.delete(key);
    fs.rmSync(this.sessionDir(key), { recursive: true, force: true });
    await User.findByIdAndUpdate(key, {
      "whatsapp.status": "disconnected",
      "whatsapp.historySyncStatus": "idle",
      "whatsapp.historySyncedCount": 0,
    });
  }
}

export const whatsAppManager = new WhatsAppManager();
