import { Resend } from "resend";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

function renderHtml(user, digest) {
  const leadsHtml = digest.hotLeads.length
    ? `<ul>${digest.hotLeads.map((c) => `<li>${c.displayName} — ${c.lastMessagePreview || ""}</li>`).join("")}</ul>`
    : "<p>Aucun lead chaud cette semaine.</p>";

  return `
    <h2>Bonjour ${user.businessName},</h2>
    <p>Voici ton résumé de la semaine sur Relance :</p>
    <h3>${digest.hotLeads.length} lead(s) chaud(s)</h3>
    ${leadsHtml}
    <h3>${digest.paidInvoicesCount} facture(s) payée(s)</h3>
    <p>${formatFcfa(digest.paidInvoicesTotal)} encaissés cette semaine.</p>
    <h3>${digest.pendingFollowUpsCount} message(s) en attente de relance</h3>
    <p><a href="${process.env.FRONTEND_BASE_URL || ""}/relances">Voir les relances →</a></p>
  `;
}

export async function sendWeeklyDigestEmail(user, digest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.DIGEST_FROM_EMAIL,
    to: user.email,
    subject: "Ton résumé de la semaine — Relance",
    html: renderHtml(user, digest),
  });
}
