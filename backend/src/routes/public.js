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

router.get("/:storeSlug", async (req, res) => {
  const user = await User.findOne({ storeSlug: req.params.storeSlug.toLowerCase() });
  if (!user) return res.status(404).json({ error: "Boutique introuvable" });

  const products = await Product.find({ owner: user._id, status: "disponible" })
    .sort({ createdAt: -1 })
    .select("name description price photos slug");

  res.json({ businessName: user.businessName, products });
});

export default router;
