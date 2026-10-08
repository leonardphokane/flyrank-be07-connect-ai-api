import express from "express";
import triageRoute from "./routes/triage.js";
import campaignRoute from "./routes/campaign.js";

const app = express();
app.use(express.json());

app.use("/triage", triageRoute);
app.use("/campaign", campaignRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Demo campaign on startup
  const demoCampaign = {
    id: "cmp_123",
    idempotencyKey: "unique-key-123",
    retryAfter: null,
  };
  import("./services/queueWorker.js").then(({ processCampaign }) =>
    processCampaign(demoCampaign)
  );
});
