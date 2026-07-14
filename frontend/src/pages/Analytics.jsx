import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

function BarList({ items, emptyLabel = "Pas encore de données." }) {
  if (items.length === 0) return <p className="text-muted" style={{ fontSize: 13 }}>{emptyLabel}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      {items.map((item) => (
        <div key={item.key} className="bar-row">
          <span className="bar-row__label">{item.label}</span>
          <span className="bar-row__track">
            <span className="bar-row__fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </span>
          <span className="bar-row__count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    api
      .get("/analytics/summary")
      .then(setData)
      .catch((err) => {
        if (err.message.includes("réservée")) setLocked(true);
      });
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    setExportError("");
    try {
      await api.download("/analytics/contacts.csv", "contacts.csv");
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (locked) {
    return (
      <div className="stack">
        <h1 className="display-2">Analytique</h1>
        <div className="empty">
          <div className="h2">Fonctionnalité Business</div>
          <p style={{ marginBottom: 20 }}>Passe au plan Business pour débloquer les statistiques.</p>
          <Link to="/abonnement" className="btn btn--primary">Voir les plans</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const topHours = [...data.activity.byHour]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((h) => ({ key: h.hour, label: `${h.hour}h`, count: h.count }));

  const byDay = data.activity.byDay.map((d) => ({ key: d.day, label: d.day, count: d.count }));

  const topTags = data.topTags.map((t) => ({ key: t.label, label: t.label, count: t.count }));

  const topContacts = data.topContacts.map((c) => ({
    key: c._id,
    label: c.displayName,
    count: c.messageCount,
  }));

  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="display-2">Analytique</h1>
        <button className="btn btn--sm" onClick={exportCsv} disabled={exporting}>
          {exporting ? "Export…" : "Exporter en CSV"}
        </button>
      </div>
      {exportError && <p className="field-error">{exportError}</p>}

      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Pipeline</div>
        <div className="stat-grid">
          {data.funnel.map((f) => (
            <div key={f.status} className="stat">
              <div className="stat__value">{f.count}</div>
              <div className="stat__label">{STATUS_LABEL[f.status] || f.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Temps de réponse moyen</span>
        {data.avgResponseTime.sampleSize > 0 ? (
          <>
            <div className="stat__value" style={{ marginTop: 8 }}>{data.avgResponseTime.avgMinutes} min</div>
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Basé sur {data.avgResponseTime.sampleSize} réponse{data.avgResponseTime.sampleSize > 1 ? "s" : ""} (90 derniers jours)
            </p>
          </>
        ) : (
          <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>—</p>
        )}
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Tags les plus utilisés</span>
        <div style={{ marginTop: 10 }}>
          <BarList items={topTags} emptyLabel="Aucun tag utilisé pour l'instant." />
        </div>
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Clients les plus actifs</span>
        <div style={{ marginTop: 10 }}>
          <BarList items={topContacts} emptyLabel="Pas encore de conversations." />
        </div>
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Heures d'affluence</span>
        <p className="text-muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 10 }}>
          Quand tes clients t'écrivent le plus.
        </p>
        <BarList items={topHours} />
      </div>

      <div className="card card--tight">
        <span className="eyebrow">Jours d'affluence</span>
        <div style={{ marginTop: 10 }}>
          <BarList items={byDay} />
        </div>
      </div>
    </div>
  );
}
