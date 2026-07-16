import { Router } from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Invoice from "../models/Invoice.js";

// No requireAuth on this router — everything here is served to anonymous
// visitors (a vendor's customers), so every handler must whitelist exactly
// the fields it returns and never leak internal user data (email, plan, etc).
const router = Router();

router.get("/invoice/:publicToken", async (req, res) => {
  const invoice = await Invoice.findOne({ publicToken: req.params.publicToken }).populate("owner", "businessName");
  if (!invoice) return res.status(404).json({ error: "Facture introuvable" });

  res.json({
    items: invoice.items,
    total: invoice.total,
    status: invoice.status,
    businessName: invoice.owner.businessName,
    createdAt: invoice.createdAt,
  });
});

// Cross-vendor discovery feed for the marketplace home page — only products
// from identity-verified vendors are surfaced here (see User.isVerifiedSeller),
// even though a pending vendor can still manage their own catalog privately.
router.get("/marketplace/products", async (req, res) => {
  const { q } = req.query;
  const verifiedVendors = await User.find({
    accountType: "vendeur",
    "sellerVerification.status": "approuvee",
  }).select("_id businessName storeSlug");
  const vendorIds = verifiedVendors.map((v) => v._id);
  const vendorsById = new Map(verifiedVendors.map((v) => [v._id.toString(), v]));

  const filter = { owner: { $in: vendorIds }, status: "disponible" };
  if (q?.trim()) filter.name = { $regex: q.trim(), $options: "i" };

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .select("owner name description price photos slug");

  res.json({
    products: products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      photos: p.photos,
      slug: p.slug,
      vendor: {
        businessName: vendorsById.get(p.owner.toString())?.businessName,
        storeSlug: vendorsById.get(p.owner.toString())?.storeSlug,
      },
    })),
  });
});

router.get("/:storeSlug", async (req, res) => {
  const user = await User.findOne({ storeSlug: req.params.storeSlug.toLowerCase() });
  if (!user) return res.status(404).json({ error: "Boutique introuvable" });

  const products = await Product.find({ owner: user._id, status: "disponible" })
    .sort({ createdAt: -1 })
    .select("name description price photos slug");

  res.json({ businessName: user.businessName, products });
});

export default router;
