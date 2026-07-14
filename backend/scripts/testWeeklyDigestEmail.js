// One-off: sends a single weekly digest email to a test address, so the
// rendering/delivery can be checked without waiting for the Monday cron.
// Requires RESEND_API_KEY and DIGEST_FROM_EMAIL to be set.
import "dotenv/config";
import { sendWeeklyDigestEmail } from "../src/services/emailDigest.js";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/testWeeklyDigestEmail.js <email-destinataire>");
  process.exit(1);
}

const fakeUser = { businessName: "Boutique Test", email: to };
const fakeDigest = {
  hotLeads: [{ displayName: "Aïcha Koné", lastMessagePreview: "C'est combien la robe bleue ?" }],
  paidInvoicesCount: 2,
  paidInvoicesTotal: 37000,
  pendingFollowUpsCount: 4,
};

await sendWeeklyDigestEmail(fakeUser, fakeDigest);
console.log(`Email envoyé à ${to}`);
