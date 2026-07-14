import { Router } from "express";
import Tag from "../models/Tag.js";
import Contact from "../models/Contact.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const tags = await Tag.find({ owner: req.user._id }).sort({ label: 1 });
  res.json({ tags });
});

router.post("/", async (req, res) => {
  const { label, color } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: "label est requis" });

  try {
    const tag = await Tag.create({ owner: req.user._id, label: label.trim(), color });
    res.status(201).json({ tag });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Ce tag existe déjà" });
    throw err;
  }
});

router.delete("/:id", async (req, res) => {
  const tag = await Tag.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!tag) return res.status(404).json({ error: "Tag introuvable" });
  await Contact.updateMany({ owner: req.user._id, tags: tag._id }, { $pull: { tags: tag._id } });
  res.status(204).end();
});

export default router;
