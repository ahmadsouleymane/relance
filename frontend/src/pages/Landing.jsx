import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconContacts, IconBell, IconBox, IconCheck } from "../components/icons.jsx";
import Logomark from "../components/Logomark.jsx";

const PILLARS = [
  {
    icon: IconContacts,
    title: "Zéro effort",
    body: "Chaque conversation WhatsApp devient une fiche contact toute seule, sans rien remplir. Ton historique client existe déjà — Relance le récupère à la connexion.",
  },
  {
    icon: IconBell,
    title: "Relance intelligente",
    body: "Relance repère les clients qui attendent une réponse, les classe par urgence, et te dit qui recontacter en premier.",
  },
  {
    icon: IconBox,
    title: "Vitrine et ventes",
    body: "Partage ton catalogue en ligne et encaisse tes ventes avec un simple lien à coller dans la conversation — inclus dans ton abonnement.",
  },
];

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

export default function Landing() {
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    api.get("/billing/plans").then((d) => setPlans(d.plans)).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={28} />
          <span className="h1">Relance</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/connexion" className="btn btn--ghost btn--sm">Se connecter</Link>
          <Link to="/inscription" className="btn btn--primary btn--sm">Créer un compte</Link>
        </div>
      </header>

      <section className="landing-hero">
        <span className="eyebrow">CRM WhatsApp pour commerçants</span>
        <h1 className="display-1">Ne perds plus un client dans tes conversations WhatsApp.</h1>
        <p className="text-muted" style={{ fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
          Ton historique se construit tout seul, Relance te dit qui recontacter, et ta vitrine vend pour toi —
          sans jamais envoyer un message à ta place.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 8 }}>
          <Link to="/inscription" className="btn btn--primary">7 jours d'essai gratuit</Link>
          <Link to="/connexion" className="btn btn--ghost">Se connecter</Link>
        </div>

        <div className="landing-hero-mockup">
          <div style={{ background: "var(--ink)", color: "var(--paper)", padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>
            Aujourd'hui
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--accent-tint)", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "var(--accent-ink)" }}>
              7 clients attendent une réponse →
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>128 400 F</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Ventes ce mois</div>
              </div>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>15</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Contacts actifs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card card--tight landing-feature">
            <Icon width={22} height={22} />
            <div className="h2" style={{ marginTop: 10 }}>{title}</div>
            <p className="text-muted" style={{ fontSize: 13.5, marginTop: 6 }}>{body}</p>
          </div>
        ))}
      </section>

      {plans && (
        <section className="landing-pricing">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span className="eyebrow">Tarifs</span>
            <h2 className="display-2" style={{ marginTop: 6 }}>Un plan pour chaque étape</h2>
          </div>
          <div className="plan-grid">
            {Object.values(plans).map((plan) => (
              <div key={plan.id} className={`plan-card${plan.id === "pro" ? " plan-card--featured" : ""}`}>
                {plan.id === "pro" && <span className="plan-card__badge">Le plus choisi</span>}
                <div className="h1">{plan.label}</div>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{plan.description}</p>
                <div className="plan-card__price">
                  {formatFcfa(plan.monthlyPrice)}<span> / mois</span>
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}><IconCheck width={15} height={15} /> {FEATURE_LABEL[f] || f}</li>
                  ))}
                </ul>
                <Link to="/inscription" className={`btn btn--block ${plan.id === "pro" ? "btn--primary" : ""}`}>
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <span className="text-muted" style={{ fontSize: 12 }}>Relance — fait pour les vendeurs WhatsApp de Côte d'Ivoire.</span>
      </footer>
    </div>
  );
}
