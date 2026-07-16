import cron from "node-cron";
import { sweepTimeouts } from "../services/orderEngine.js";

export function scheduleOrderTimeoutJob() {
  // Every 15 minutes — the deadlines themselves are hours/days wide, so this
  // granularity is more than enough and cheap to run.
  cron.schedule("*/15 * * * *", () => {
    sweepTimeouts().catch((err) => console.error("[order-timeout] sweep failed", err));
  });
}
