// One-off setup script: registers this API's webhook endpoint with GeniusPay.
// Run once per environment (sandbox and live use different API keys/URLs):
//   node scripts/registerWebhook.js
import "dotenv/config";
import { registerWebhook } from "../src/services/geniusPay.js";

const url = `${process.env.APP_BASE_URL}/api/billing/webhook/geniuspay`;

registerWebhook({ url, events: ["payment.success", "payment.failed"] })
  .then((data) => {
    console.log("Webhook registered:", data);
  })
  .catch((err) => {
    console.error("Failed to register webhook:", err.message);
    process.exit(1);
  });
