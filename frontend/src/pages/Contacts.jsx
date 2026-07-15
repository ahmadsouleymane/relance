import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconSearch } from "../components/icons.jsx";

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

const STATUS_FILTERS = [
  { key: "", label: "Tous" },
  { key: "nouveau", label: "Nouveau" },
  { key: "en_negociation", label: "En négociation" },
  { key: "client", label: "Client" },
  { key: "perdu", label: "Perdu" },
];

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

// "froid" gets no badge — only worth calling out when a lead is worth acting on.
const LEAD_SCORE_LABEL = { chaud: "Chaud", tiede: "Tiède" };

export default function Contacts() {
  const [contacts, setContacts] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      const qs = params.toString() ? `?${params.toString()}` : "";
      api.get(`/contacts${qs}`).then((d) => setContacts(d.contacts)).catch(() => setContacts([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, status]);

  const isEmpty = contacts && contacts.length === 0 && !query && !status;

  return (
    <div className="stack">
      <h1 className="display-2">Contacts</h1>

      <div className="search-bar">
        <IconSearch width={18} height={18} />
        <input placeholder="Chercher un nom, un numéro…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="pill"
            style={{ opacity: status === f.key ? 1 : 0.5, cursor: "pointer" }}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!contacts && <ListSkeleton />}

      {isEmpty && (
        <div className="empty">
          <div className="h2">Pas encore de contact</div>
          <p>Connecte ton WhatsApp pour commencer à voir tes conversations ici.</p>
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
