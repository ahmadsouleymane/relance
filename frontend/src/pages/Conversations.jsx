import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { IconSearch, IconCheck, IconAlert, IconClock } from "../components/icons.jsx";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diffMs / 3600000);
    if (hours <= 0) return "à l'instant";
    return `${hours}h`;
  }
  if (days === 1) return "hier";
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

// "froid" gets no badge — only worth calling out when a lead is worth acting on.
const LEAD_SCORE_LABEL = { chaud: "Chaud", tiede: "Tiède" };

const URGENCY_ICON = { critique: IconAlert, attention: IconClock, info: IconClock };
const URGENCY_TEXT = { critique: "Risque de perte", attention: "À relancer", info: "À relancer bientôt" };

const TABS = [
  { key: "tous", label: "Tous" },
  { key: "a-relancer", label: "À relancer" },
  { key: "client", label: "Clients" },
  { key: "perdu", label: "Perdus" },
];

export default function Conversations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filtre = searchParams.get("filtre") || "tous";

  const [contacts, setContacts] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLocked, setSuggestionsLocked] = useState(false);

  const setFiltre = (key) => setSearchParams(key === "tous" ? {} : { filtre: key });

  useEffect(() => {
    if (filtre === "a-relancer") return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filtre === "client" || filtre === "perdu") params.set("status", filtre);
      const qs = params.toString() ? `?${params.toString()}` : "";
      api.get(`/contacts${qs}`).then((d) => setContacts(d.contacts)).catch(() => setContacts([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, filtre]);

  const loadSuggestions = () =>
    api
      .get("/suggestions")
      .then((d) => setSuggestions(d.suggestions))
      .catch((err) => {
        if (err.message.includes("réservée")) setSuggestionsLocked(true);
        setSuggestions([]);
      });

  useEffect(() => {
    if (filtre === "a-relancer") loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtre]);

  const dismiss = async (contactId) => {
    await api.post(`/contacts/${contactId}/follow-up/dismiss`, {});
    loadSuggestions();
  };

  const isEmpty = contacts && contacts.length === 0 && !query && filtre === "tous";

  return (
    <div className="stack">
      <h1 className="display-2">Conversations</h1>

      <div className="segmented" style={{ flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={filtre === t.key ? "is-active" : ""} onClick={() => setFiltre(t.key)}>
            {t.label}
            {t.key === "a-relancer" && suggestions?.length > 0 ? ` · ${suggestions.length}` : ""}
          </button>
        ))}
      </div>

      {filtre !== "a-relancer" && (
        <>
          <div className="search-bar">
            <IconSearch width={18} height={18} />
            <input placeholder="Chercher un nom, un numéro…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {!contacts && <ListSkeleton />}

          {isEmpty && (
            <div className="empty">
              <div className="h2">Pas encore de contact</div>
              <p>Connecte ton WhatsApp pour commencer à voir tes conversations ici.</p>
            </div>
          )}

          {contacts && contacts.length === 0 && (query || filtre !== "tous") && (
            <div className="empty">
              <div className="h2">Aucun résultat</div>
              <p>Essaie un autre nom, numéro ou filtre.</p>
            </div>
          )}

          {contacts && contacts.length > 0 && (
            <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
              {contacts.map((c) => (
                <li key={c._id}>
                  <Link to={`/conversations/${c._id}`} className="contact-row">
                    <div className="avatar">{initialsOf(c.displayName)}</div>
                    <div className="contact-row__body">
                      <div className="contact-row__top">
                        <span className="contact-row__name">{c.displayName}</span>
                        <span className="contact-row__time">{relativeTime(c.lastMessageAt)}</span>
                      </div>
                      <div className="contact-row__preview">
                        {c.lastMessageDirection === "outbound" ? "Toi : " : ""}
                        {c.lastMessagePreview || "—"}
                      </div>
                      {(c.tags?.length > 0 || c.status || LEAD_SCORE_LABEL[c.leadLabel]) && (
                        <div className="contact-row__tags">
                          {LEAD_SCORE_LABEL[c.leadLabel] && (
                            <span className={`pill${c.leadLabel === "chaud" ? " pill--accent" : ""}`} style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              {LEAD_SCORE_LABEL[c.leadLabel]}
                            </span>
                          )}
                          {c.status && c.status !== "nouveau" && (
                            <span className="pill" style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              {STATUS_LABEL[c.status] || c.status}
                            </span>
                          )}
                          {c.tags?.map((t) => (
                            <span key={t._id} className="tag-chip" style={{ padding: "2px 8px", fontSize: 10.5 }}>
                              <span className="tag-swatch" style={{ background: t.color }} />
                              {t.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {filtre === "a-relancer" && suggestionsLocked && (
        <div className="empty">
          <div className="h2">Fonctionnalité Pro</div>
          <p style={{ marginBottom: 20 }}>Passe au plan Pro pour voir quels clients attendent une réponse.</p>
          <Link to="/reglages/abonnement" className="btn btn--primary">Voir les plans</Link>
        </div>
      )}

      {filtre === "a-relancer" && !suggestionsLocked && (
        <>
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
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <Link to={`/conversations/${contact._id}`} className="btn btn--sm btn--ghost" style={{ flex: 1 }}>
                      Voir la conversation
                    </Link>
                    <button
                      className="btn btn--sm btn--primary"
                      type="button"
                      disabled
                      title="Message de relance pré-rempli — bientôt disponible"
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                    >
                      Relancer
                    </button>
                    <button className="btn btn--sm" onClick={() => dismiss(contact._id)}>
                      <IconCheck width={14} height={14} /> Relancé
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ListSkeleton() {
  const rows = useMemo(() => Array.from({ length: 6 }), []);
  return (
    <div className="stack--sm">
      {rows.map((_, i) => (
        <div key={i} className="row" style={{ padding: "10px 4px" }}>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 999 }} />
          <div className="stack--sm" style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "50%", height: 12 }} />
            <div className="skeleton" style={{ width: "80%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
