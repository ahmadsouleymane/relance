import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconCheck } from "../components/icons.jsx";

const CYCLE_LABEL = { monthly: "Mensuel", quarterly: "Trimestriel", yearly: "Annuel" };
const FEATURE_LABEL = {
  logging: "Historique des conversations",
  contacts: "Carnet de contacts",
  tags: "Tags manuels",
  suggestions: "Suggestions de relance",
  reminders: "Rappels",
  analytics: "Statistiques produits",
  multi_account: "Comptes WhatsApp multiples",
};

function formatFcfa(n) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

export default function Billing() {
  const { user, refresh } = useAuth();
  const [plans, setPlans] = useState(null);
  const [cycles, setCycles] = useState(null);
  const [cycle, setCycle] = useState("quarterly");
  const [pendingRef, setPendingRef] = useState(localStorage.getItem("relance_pending_payment"));
  const [checking, setChecking] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(null);

  useEffect(() => {
    api.get("/billing/plans").then((d) => {
      setPlans(d.plans);
      setCycles(d.cycles);
    });
  }, []);

  const checkout = async (planId) => {
    setCheckoutBusy(planId);
    try {
      const data = await api.post("/billing/checkout", { planId, cycle });
      localStorage.setItem("relance_pending_payment", data.reference);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(err.message);
      setCheckoutBusy(null);
    }
  };

  const checkStatus = async () => {
    if (!pendingRef) return;
    setChecking(true);
    try {
      const { payment } = await api.get(`/billing/checkout/${pendingRef}`);
      if (payment.status === "completed") {
        localStorage.removeItem("relance_pending_payment");
        setPendingRef(null);
        await refresh();
      } else if (payment.status === "failed") {
        localStorage.removeItem("relance_pending_payment");
        setPendingRef(null);
      }
    } finally {
      setChecking(false);
    }
  };

  if (!plans || !cycles) return null;

  return (
    <div className="stack">
      <h1 className="display-2">Abonnement</h1>

      <div className="card row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Plan actuel</div>
          <div className="h2" style={{ textTransform: "capitalize" }}>{user?.plan?.id}</div>
        </div>
        <span className={`pill ${user?.plan?.status === "active" ? "pill--live" : "pill--accent"}`}>
          {user?.plan?.status === "trialing" ? "Essai gratuit" : user?.plan?.status === "active" ? "Actif" : user?.plan?.status}
        </span>
      </div>

      {pendingRef && (
        <div className="card" style={{ background: "var(--accent-tint)", borderColor: "var(--accent-ink)" }}>
          <p style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>Paiement en cours de confirmation…</p>
          <button className="btn btn--sm" onClick={checkStatus} disabled={checking}>
            {checking ? "Vérification…" : "Vérifier mon paiement"}
          </button>
        </div>
      )}

      <div className="segmented">
        {Object.entries(cycles).map(([key]) => (
          <button key={key} type="button" className={cycle === key ? "is-active" : ""} onClick={() => setCycle(key)}>
            {CYCLE_LABEL[key]}
            {cycles[key].discount > 0 ? ` -${Math.round(cycles[key].discount * 100)}%` : ""}
          </button>
        ))}
      </div>

      <div className="plan-grid">
        {Object.values(plans).map((plan) => {
          const months = cycles[cycle].months;
          const discount = cycles[cycle].discount;
          const total = Math.round(plan.monthlyPrice * months * (1 - discount));
          const perMonth = Math.round(total / months);
          const featured = plan.id === "pro";
          return (
            <div key={plan.id} className={`plan-card${featured ? " plan-card--featured" : ""}`}>
              {featured && <span className="plan-card__badge">Le plus choisi</span>}
              <div className="h1">{plan.label}</div>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{plan.description}</p>
              <div className="plan-card__price">
                {formatFcfa(perMonth)}<span> / mois</span>
              </div>
              <p className="text-muted mono" style={{ fontSize: 11.5 }}>
                {formatFcfa(total)} facturé{months > 1 ? "s" : ""} / {months} mois
              </p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}><IconCheck width={15} height={15} /> {FEATURE_LABEL[f] || f}</li>
                ))}
              </ul>
              <button
                className={`btn btn--block ${featured ? "btn--primary" : ""}`}
                onClick={() => checkout(plan.id)}
                disabled={checkoutBusy === plan.id}
              >
                {checkoutBusy === plan.id ? "Redirection…" : user?.plan?.id === plan.id ? "Renouveler" : "Choisir"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-muted" style={{ fontSize: 12, textAlign: "center" }}>
        Paiement sécurisé via GeniusPay — Wave, Orange Money, MTN MoMo, Moov ou carte bancaire.
      </p>
    </div>
  );
}
