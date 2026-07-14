import { Router } from "express";
import Contact from "../models/Contact.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// List contacts, most recent conversation first. Optional ?q= search, ?tag= filter.
router.get("/", async (req, res) => {
  const { q, tag } = req.query;
  const filter = { owner: req.user._id };

  if (q) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ displayName: rx }, { pushName: rx }, { phoneNumber: rx }];
  }
  if (tag) filter.tags = tag;

  const contacts = await Contact.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate("tags")
    .limit(500);

  res.json({ contacts });
});

router.get("/:id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id }).populate("tags");
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });
  res.json({ contact });
});

router.patch("/:id", async (req, res) => {
  const { displayName, notes } = req.body;
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: { ...(displayName !== undefined ? { displayName } : {}), ...(notes !== undefined ? { notes } : {}) } },
    { new: true }
  ).populate("tags");
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });
  res.json({ contact });
});

router.post("/:id/tags/:tagId", async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $addToSet: { tags: req.params.tagId } },
    { new: true }
  ).populate("tags");
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });
  res.json({ contact });
});

router.delete("/:id/tags/:tagId", async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $pull: { tags: req.params.tagId } },
    { new: true }
  ).populate("tags");
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });
  res.json({ contact });
});

// Mark a contact's follow-up as handled without requiring a new outbound message
// (e.g. the vendor called the client instead of writing on WhatsApp).
router.post("/:id/follow-up/dismiss", async (req, res) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: { lastFollowUpAt: new Date() } },
    { new: true }
  ).populate("tags");
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });
  res.json({ contact });
});

router.get("/:id/messages", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params.id, owner: req.user._id });
  if (!contact) return res.status(404).json({ error: "Contact introuvable" });

  const messages = await Message.find({ contact: contact._id, owner: req.user._id })
    .sort({ timestamp: 1 })
    .limit(1000);

  res.json({ messages });
});

export default router;
