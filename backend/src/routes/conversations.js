import { Router } from "express";
import Conversation from "../models/Conversation.js";
import ChatMessage from "../models/ChatMessage.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { emitToUser } from "../services/realtime.js";

const router = Router();
router.use(requireAuth);

function isParticipant(conversation, userId) {
  return conversation.buyer.equals(userId) || conversation.vendor.equals(userId);
}

router.get("/", async (req, res) => {
  const conversations = await Conversation.find({
    $or: [{ buyer: req.user._id }, { vendor: req.user._id }],
  })
    .sort({ lastMessageAt: -1 })
    .populate("buyer", "businessName")
    .populate("vendor", "businessName")
    .populate("product", "name price photos");
  res.json({ conversations });
});

router.post("/", async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: "productId est requis" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable" });
  if (product.owner.equals(req.user._id)) {
    return res.status(400).json({ error: "Vous ne pouvez pas discuter de votre propre produit" });
  }

  const conversation = await Conversation.findOneAndUpdate(
    { buyer: req.user._id, vendor: product.owner, product: product._id },
    { $setOnInsert: { buyer: req.user._id, vendor: product.owner, product: product._id } },
    { upsert: true, new: true }
  );
  res.status(201).json({ conversation });
});

router.get("/:id/messages", async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || !isParticipant(conversation, req.user._id)) {
    return res.status(404).json({ error: "Conversation introuvable" });
  }
  const messages = await ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });
  res.json({ messages });
});

router.post("/:id/messages", async (req, res) => {
  const { text, offerPrice } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "text est requis" });

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || !isParticipant(conversation, req.user._id)) {
    return res.status(404).json({ error: "Conversation introuvable" });
  }

  if (offerPrice !== undefined) {
    if (!conversation.vendor.equals(req.user._id)) {
      return res.status(403).json({ error: "Seul le vendeur peut envoyer une offre" });
    }
    if (typeof offerPrice !== "number" || offerPrice <= 0) {
      return res.status(400).json({ error: "offerPrice invalide" });
    }
  }

  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
    ...(offerPrice !== undefined ? { offerPrice } : {}),
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = offerPrice !== undefined ? `Offre : ${offerPrice} FCFA` : text.trim();
  await conversation.save();

  const recipient = conversation.buyer.equals(req.user._id) ? conversation.vendor : conversation.buyer;
  emitToUser(recipient, "message:new", { conversationId: conversation._id.toString(), message });

  res.status(201).json({ message });
});

export default router;
