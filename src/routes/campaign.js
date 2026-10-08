import express from "express";
import { processCampaign } from "../services/queueWorker.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const campaign = {
    id: req.body.id,
    idempotencyKey: req.body.idempotencyKey,
    retryAfter: req.body.retryAfter || null,
  };

  try {
    const result = await processCampaign(campaign);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
