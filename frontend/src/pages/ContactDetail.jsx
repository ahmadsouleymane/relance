import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconTag, IconCheck, IconX, IconClock } from "../components/icons.jsx";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function timeLabel(date) {
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META = {
  nouveau: { label: "Nouveau", pillClass: "pill" },
  en_negociation: { label: "En négociation", pillClass: "pill pill--accent" },
  client: { label: "Client", pillClass: "pill pill--live" },
  perdu: { label: "Perdu", pillClass: "pill pill--danger" },
};

// "froid" gets no badge — it's the default, silent state; only worth
// calling out when a lead is worth acting on.
const LEAD_SCORE_META = {
  chaud: { label: "Chaud", pillClass: "pill pill--accent" },
  tiede: { label: "Tiède", pillClass: "pill" },
};

export default function ContactDetail() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = () => {
    api.get(`/contacts/${id}`).then((d) => {
      setContact(d.contact);
      setNotes(d.contact.notes || "");
    });
    api.get(`/contacts/${id}/messages`).then((d) => setMessages(d.messages));
  };

  useEffect(() => {
    load();
    api.get("/tags").then((d) => setAllTags(d.tags)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleTag = async (tagId, has) => {
    if (has) await api.delete(`/contacts/${id}/tags/${tagId}`);
    else await api.post(`/contacts/${id}/tags/${tagId}`, {});
    load();
  };

  const dismissFollowUp = async () => {
    await api.post(`/contacts/${id}/follow-up/dismiss`, {});
    load();
  };

  const setStatus = async (status) => {
    await api.patch(`/contacts/${id}`, { status });
    load();
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/contacts/${id}`, { notes });
    } finally {
      setSavingNotes(false);
    }
  };

  if (!contact) return null;

  const needsFollowUp =
    contact.lastMessageDirection === "inbound" &&
    (!contact.lastFollowUpAt || new Date(contact.lastFollowUpAt) < new Date(contact.lastMessageAt));

  let lastDay = null;

  return (
    <div className="stack">
      <Link to="/conversations" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
        ← Conversations
      </Link>

      <div className="row" style={{ gap: 14 }}>
        <div className="avatar" style={{ width: 54, height: 54, fontSize: 18 }}>{initialsOf(contact.displayName)}</div>
        <div>
          <div className="row" style={{ gap: 8 }}>
            <div className="h1">{contact.displayName}</div>
            {LEAD_SCORE_META[contact.leadLabel] && (
              <span className={LEAD_SCORE_META[contact.leadLabel].pillClass} style={{ fontSize: 10.5 }}>
                {LEAD_SCORE_META[contact.leadLabel].label}
              </span>
            )}
          </div>
          <div className="text-muted mono" style={{ fontSize: 12.5 }}>{contact.phoneNumber}</div>
        </div>
      </div>

      {needsFollowUp && (
        <div className="suggestion-card suggestion-card--attention">
          <div className="row" style={{ gap: 10 }}>
            <IconClock width={18} height={18} />
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>Ce client attend une réponse</span>
          </div>
          <button className="btn btn--sm" onClick={dismissFollowUp}>
            <IconCheck width={14} height={14} /> J'ai relancé
          </button>
        </div>
      )}

      <div className="card card--tight">
        <span className="eyebrow">Statut</span>
        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {Object.entries(STATUS_META).map(([key, meta]) => {
            const active = contact.status === key;
            return (
              <button
                key={key}
                type="button"
                className={meta.pillClass}
                style={{ opacity: active ? 1 : 0.5, cursor: "pointer", border: "1.5px solid var(--line)" }}
                onClick={() => setStatus(key)}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card card--tight">
        <div className="row row--between" style={{ marginBottom: 10 }}>
          <span className="eyebrow">Tags</span>
          <button className="btn btn--ghost btn--sm" onClick={() => setShowTagPicker((v) => !v)}>
            <IconTag width={14} height={14} /> Gérer
          </button>
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {contact.tags.length === 0 && <span className="text-muted" style={{ fontSize: 13 }}>Aucun tag</span>}
          {contact.tags.map((t) => (
            <span key={t._id} className="tag-chip">
              <span className="tag-swatch" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
        {showTagPicker && (
          <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1.5px solid var(--line-soft)" }}>
            {allTags.map((t) => {
              const has = contact.tags.some((ct) => ct._id === t._id);
              return (
                <button key={t._id} type="button" className="tag-chip" onClick={() => toggleTag(t._id, has)} style={{ opacity: has ? 1 : 0.5, cursor: "pointer" }}>
                  <span className="tag-swatch" style={{ background: t.color }} />
                  {t.label}
                  {has ? <IconX width={11} height={11} /> : <IconCheck width={11} height={11} />}
                </button>
              );
            })}
            {allTags.length === 0 && (
              <Link to="/conversations/tags" className="text-muted" style={{ fontSize: 12.5 }}>Créer un tag →</Link>
            )}
          </div>
        )}
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Notes</span>
        <div className="field" style={{ marginTop: 10, marginBottom: 8 }}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Préférences du client, historique d'achat…" />
        </div>
        <button className="btn btn--sm" onClick={saveNotes} disabled={savingNotes}>
          {savingNotes ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Historique</div>
        <div className="thread">
          {messages == null && <p className="text-muted" style={{ fontSize: 13 }}>Chargement…</p>}
          {messages?.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>Aucun message pour l'instant.</p>}
          {messages?.map((m) => {
            const day = dayLabel(m.timestamp);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <div key={m._id} style={{ display: "contents" }}>
                {showDay && <span className="thread-day">{day}</span>}
                <div className={`bubble bubble--${m.direction === "inbound" ? "in" : "out"}`}>
                  {m.text || `[${m.type}]`}
                  <span className="bubble__time">{timeLabel(m.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
