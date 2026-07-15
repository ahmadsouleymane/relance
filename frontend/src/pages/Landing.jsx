import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconContacts, IconBell, IconBox, IconChart, IconCheck } from "../components/icons.jsx";
import Logomark from "../components/Logomark.jsx";

const FEATURES = [
  {
    icon: IconContacts,
    title: "Historique client automatique",
    body: "Chaque conversation WhatsApp devient une fiche contact, sans rien remplir toi-même.",
  },
  {
    icon: IconBell,
    title: "Sais qui relancer",
    body: "Relance repère les clients qui attendent une réponse et les classe par urgence.",
  },
  {
    icon: IconBox,
    title: "Vitrine et factures",
    body: "Partage ton catalogue et encaisse tes ventes avec un simple lien à coller dans la conversation.",
  },
  {
    icon: IconChart,
    title: "Statistiques claires",
    body: "Vois d'où viennent tes ventes, qui sont tes meilleurs clients, et quand ils t'écrivent.",
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
          Relance historise tes échanges, te dit qui relancer, et te donne une vitrine pour vendre —
          sans jamais envoyer un message à ta place.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 8 }}>
          <Link to="/inscription" className="btn btn--primary">7 jours d'essai gratuit</Link>
          <Link to="/connexion" className="btn btn--ghost">Se connecter</Link>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map(({ icon: Icon, title, body }) => (
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
