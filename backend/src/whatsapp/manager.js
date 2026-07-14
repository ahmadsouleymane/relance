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
import { logInboundMessage, logOutboundMessage } from "../services/messageIngest.js";

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
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    this.sessions.set(key, { sock, qr: null, status: "connecting" });
    await User.findByIdAndUpdate(key, { "whatsapp.status": "connecting" });

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
        }
        await User.findByIdAndUpdate(key, {
          "whatsapp.status": "connected",
          "whatsapp.phoneNumber": phoneNumber,
          "whatsapp.lastConnectedAt": new Date(),
        });
        console.log(`[wa:${key}] connected as ${phoneNumber}`);
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

    return sock;
  }

  async stop(userId) {
    const key = String(userId);
    const session = this.sessions.get(key);
    if (session?.sock) {
      await session.sock.logout().catch(() => {});
    }
    this.sessions.delete(key);
    fs.rmSync(this.sessionDir(key), { recursive: true, force: true });
    await User.findByIdAndUpdate(key, { "whatsapp.status": "disconnected" });
  }
}

export const whatsAppManager = new WhatsAppManager();
