import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createPresignedUpload } from "../services/storage.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req, res) => {
  const { contentType } = req.body;
  if (!contentType) return res.status(400).json({ error: "contentType est requis" });

  try {
    const { uploadUrl, publicUrl } = await createPresignedUpload(contentType);
    res.json({ uploadUrl, publicUrl });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

export default router;
