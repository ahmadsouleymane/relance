import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconCheck, IconAlert, IconClock } from "../components/icons.jsx";

const URGENCY_ICON = { critique: IconAlert, attention: IconClock, info: IconClock };
const URGENCY_TEXT = { critique: "Risque de perte", attention: "À relancer", info: "À relancer bientôt" };

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

export default function Relances() {
  const [suggestions, setSuggestions] = useState(null);
  const [locked, setLocked] = useState(false);

  const load = () =>
    api
      .get("/suggestions")
      .then((d) => setSuggestions(d.suggestions))
      .catch((err) => {
        if (err.message.includes("réservée")) setLocked(true);
        setSuggestions([]);
      });

  useEffect(() => {
    load();
  }, []);

  const dismiss = async (contactId) => {
    await api.post(`/contacts/${contactId}/follow-up/dismiss`, {});
    load();
  };

  if (locked) {
    return (
      <div className="stack">
        <h1 className="display-2">Relances</h1>
        <div className="empty">
          <div className="h2">Fonctionnalité Pro</div>
          <p style={{ marginBottom: 20 }}>Passe au plan Pro pour voir quels clients attendent une réponse.</p>
          <Link to="/abonnement" className="btn btn--primary">Voir les plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h1 className="display-2">Relances</h1>
        <p className="text-muted" style={{ fontSize: 13.5, marginTop: 4 }}>
          Ces clients t'ont écrit et attendent une réponse. Rien n'est envoyé automatiquement — c'est un pense-bête.
        </p>
      </div>

      {suggestions == null && <p className="text-muted" style={{ fontSize: 13 }}>Chargement…</p>}

      {suggestions?.length === 0 && (
        <div className="empty">
          <div className="h2">Tout est à jour</div>
          <p>Aucun client en attente de réponse pour l'instant.</p>
        </div>
      )}

      <div className="stack">
        {suggestions?.map(({ contact, daysSince, urgency, preview }) => {
          const Icon = URGENCY_ICON[urgency];
          return (
            <div key={contact._id} className={`suggestion-card suggestion-card--${urgency}`}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initialsOf(contact.displayName)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{contact.displayName}</div>
                    <div className="row" style={{ gap: 4 }}>
                      <Icon width={13} height={13} />
                      <span style={{ fontSize: 11.5, fontWeight: 700 }}>
                        {URGENCY_TEXT[urgency]} · {daysSince} j
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {preview && (
                <p style={{ fontSize: 13, background: "var(--paper-raised)", border: "1.5px solid var(--line-soft)", borderRadius: 10, padding: 10 }}>
                  « {preview} »
                </p>
              )}
              <div className="row" style={{ gap: 8 }}>
                <Link to={`/contacts/${contact._id}`} className="btn btn--sm btn--ghost" style={{ flex: 1 }}>
                  Voir la conversation
                </Link>
                <button className="btn btn--sm" onClick={() => dismiss(contact._id)}>
                  <IconCheck width={14} height={14} /> Relancé
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
