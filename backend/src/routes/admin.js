import { Router } from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const [pendingVerifications, openDisputes, pendingPayouts, totalUsers, totalOrders] = await Promise.all([
    User.countDocuments({ "sellerVerification.status": "en_attente" }),
    Order.countDocuments({ status: "en_litige" }),
    Order.countDocuments({ status: "confirme", "payout.status": "pending" }),
    User.countDocuments({}),
    Order.countDocuments({}),
  ]);
  res.json({ pendingVerifications, openDisputes, pendingPayouts, totalUsers, totalOrders });
});

router.get("/users", async (req, res) => {
  const { q, accountType } = req.query;
  const filter = {};
  if (accountType) filter.accountType = accountType;
  if (q?.trim()) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ businessName: rx }, { email: rx }];
  }
  const users = await User.find(filter)
    .select("businessName email phone accountType sellerVerification plan createdAt")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ users });
});

router.get("/orders", async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("product", "name price")
    .populate("buyer", "businessName email")
    .populate("vendor", "businessName email");
  res.json({ orders });
});

export default router;
