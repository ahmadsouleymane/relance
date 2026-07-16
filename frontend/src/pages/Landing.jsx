import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconContacts, IconBell, IconBox, IconCheck, IconShield } from "../components/icons.jsx";
import Logomark from "../components/Logomark.jsx";

const PILLARS = [
  {
    icon: IconShield,
    title: "Argent protégé",
    body: "Un acheteur du marché paie, mais son argent reste bloqué en séquestre jusqu'à ce qu'il confirme avoir reçu le produit. Toi tu es sûr d'être payé, lui est sûr de ne pas se faire avoir.",
  },
  {
    icon: IconContacts,
    title: "Zéro effort",
    body: "Chaque conversation WhatsApp devient une fiche contact toute seule, sans rien remplir. Ton historique client existe déjà — DJASSA le récupère à la connexion.",
  },
  {
    icon: IconBell,
    title: "Relance intelligente",
    body: "DJASSA repère les clients qui attendent une réponse, les classe par urgence, et te dit qui recontacter en premier.",
  },
  {
    icon: IconBox,
    title: "Vitrine et factures",
    body: "Partage ton catalogue avec un lien à coller dans la conversation, et encaisse tes ventes — inclus dans ton abonnement.",
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
          <span className="h1">DJASSA</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/connexion" className="btn btn--ghost btn--sm">Se connecter</Link>
          <Link to="/inscription" className="btn btn--primary btn--sm">Créer un compte</Link>
        </div>
      </header>

      <section className="landing-hero market-weave">
        <span className="eyebrow">Le marché WhatsApp protégé</span>
        <h1 className="display-1">Vends sur WhatsApp. L'argent de ton client reste bloqué jusqu'à ce qu'il ait reçu sa commande.</h1>
        <p className="text-muted" style={{ fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
          Ton historique de conversation se construit tout seul, DJASSA te dit qui recontacter, et tes clients du
          marché paient en confiance — sans jamais envoyer un message à ta place.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 8 }}>
          <Link to="/inscription" className="btn btn--primary">7 jours d'essai gratuit</Link>
          <Link to="/connexion" className="btn btn--ghost">Se connecter</Link>
        </div>

        <div className="landing-hero-mockup">
          <div style={{ background: "var(--brand)", color: "var(--brand-ink)", padding: "10px 14px", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
            <span>Commande #4471</span>
            <span className="stamp" style={{ background: "none", border: "none", color: "var(--accent)", padding: 0, transform: "none" }}>
              <IconShield width={13} height={13} /> Protégée
            </span>
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--accent-tint)", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "var(--accent-ink)" }}>
              7 clients attendent une réponse →
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)" }}>128 400 F</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>Ventes ce mois</div>
              </div>
              <div style={{ flex: 1, background: "var(--paper-sunken)", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)" }}>15</div>
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
        <span className="text-muted" style={{ fontSize: 12 }}>DJASSA — fait pour les vendeurs WhatsApp de Côte d'Ivoire.</span>
      </footer>
    </div>
  );
}
