import { Router } from "express";
import QRCode from "qrcode";
import { requireAuth } from "../middleware/auth.js";
import { whatsAppManager } from "../whatsapp/manager.js";

const router = Router();

router.post("/connect", requireAuth, async (req, res) => {
  await whatsAppManager.start(req.user._id);
  res.json({ status: whatsAppManager.getStatus(req.user._id) });
});

router.get("/status", requireAuth, async (req, res) => {
  res.json({
    status: whatsAppManager.getStatus(req.user._id),
    phoneNumber: req.user.whatsapp.phoneNumber || null,
    lastConnectedAt: req.user.whatsapp.lastConnectedAt || null,
    lastDisconnectedAt: req.user.whatsapp.lastDisconnectedAt || null,
  });
});

router.get("/qr", requireAuth, async (req, res) => {
  const raw = whatsAppManager.getQr(req.user._id);
  if (!raw) return res.json({ qr: null });
  const dataUrl = await QRCode.toDataURL(raw, { margin: 1, scale: 6 });
  res.json({ qr: dataUrl });
});

router.post("/disconnect", requireAuth, async (req, res) => {
  await whatsAppManager.stop(req.user._id);
  res.json({ status: "disconnected" });
});

export default router;
