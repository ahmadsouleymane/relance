import { Router } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

const router = Router();
router.use(requireAuth);

const STATUSES = ["disponible", "rupture", "archive"];

async function uniqueSlug(owner, name) {
  const base = slugify(name) || "produit";
  let slug = base;
  let suffix = 1;
  while (await Product.exists({ owner, slug })) {
    slug = `${base}-${++suffix}`;
  }
  return slug;
}

// TODO: tiering — à rattacher à un plan une fois la décision produit prise
router.get("/", async (req, res) => {
  const { status } = req.query;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ products });
});

router.get("/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
  if (!product) return res.status(404).json({ error: "Produit introuvable" });
  res.json({ product });
});

router.post("/", async (req, res) => {
  const { name, description, price, photos, stock } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name est requis" });
  if (typeof price !== "number" || price < 0) return res.status(400).json({ error: "price invalide" });

  const slug = await uniqueSlug(req.user._id, name);
  const product = await Product.create({
    owner: req.user._id,
    name: name.trim(),
    description,
    price,
    photos,
    stock: stock ?? null,
    slug,
  });
  res.status(201).json({ product });
});

router.patch("/:id", async (req, res) => {
  const { name, description, price, photos, stock, status } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    return res.status(400).json({ error: "price invalide" });
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    {
      $set: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(photos !== undefined ? { photos } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: "Produit introuvable" });
  res.json({ product });
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!product) return res.status(404).json({ error: "Produit introuvable" });
  res.status(204).end();
});

export default router;
