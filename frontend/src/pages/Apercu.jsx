import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowRight, IconBell, IconLink, IconChart } from "../components/icons.jsx";

const STATUS_LABEL = {
  nouveau: "Nouveau",
  en_negociation: "En négociation",
  client: "Client",
  perdu: "Perdu",
};

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

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

export default function Apercu() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [digest, setDigest] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLocked, setAnalyticsLocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    api.get("/stats/dashboard").then(setStats).catch(() => {});
    api.get("/whatsapp/status").then(setWaStatus).catch(() => {});
    api.get("/digest/weekly").then(setDigest).catch(() => {});
    api
      .get("/analytics/summary")
      .then(setAnalytics)
      .catch((err) => {
        if (err.message.includes("réservée")) setAnalyticsLocked(true);
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

  const topHours = analytics
    ? [...analytics.activity.byHour].sort((a, b) => b.count - a.count).slice(0, 6).map((h) => ({ key: h.hour, label: `${h.hour}h`, count: h.count }))
    : [];
  const byDay = analytics ? analytics.activity.byDay.map((d) => ({ key: d.day, label: d.day, count: d.count })) : [];
  const topTags = analytics ? analytics.topTags.map((t) => ({ key: t.label, label: t.label, count: t.count })) : [];
  const topContacts = analytics ? analytics.topContacts.map((c) => ({ key: c._id, label: c.displayName, count: c.messageCount })) : [];

  return (
    <div className="stack">
      <div>
        <span className="eyebrow">{user?.businessName}</span>
        <h1 className="display-2">Aujourd'hui</h1>
      </div>

      {waStatus && waStatus.status !== "connected" && (
        <Link to="/reglages/whatsapp" className="briefing-alert">
          <div>
            <div className="h2">WhatsApp déconnecté</div>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Scanne le QR pour démarrer.</p>
          </div>
          <IconArrowRight width={20} height={20} style={{ flexShrink: 0 }} />
        </Link>
      )}

      {digest && (
        <div className="card">
          <span className="eyebrow">Cette semaine</span>
          <div className="stack--sm" style={{ marginTop: 10 }}>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Leads chauds</span>
              <span className="mono" style={{ fontWeight: 600 }}>{digest.hotLeads.length}</span>
            </div>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Factures payées</span>
              <span className="mono" style={{ fontWeight: 600 }}>
                {digest.paidInvoicesCount} · {formatFcfa(digest.paidInvoicesTotal)}
              </span>
            </div>
            <div className="row row--between">
              <span style={{ fontSize: 13.5 }}>Messages en attente</span>
              <span className="mono" style={{ fontWeight: 600 }}>{digest.pendingFollowUpsCount}</span>
            </div>
          </div>
        </div>
      )}

      {stats?.pendingFollowUps != null && (
        <Link to="/conversations?filtre=a-relancer" className="suggestion-card suggestion-card--attention" style={{ textDecoration: "none" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10 }}>
              <IconBell width={20} height={20} />
              <span style={{ fontWeight: 600 }}>
                {stats.pendingFollowUps} client{stats.pendingFollowUps > 1 ? "s" : ""} à relancer
              </span>
            </div>
            <IconArrowRight width={18} height={18} />
          </div>
        </Link>
      )}

      {stats?.pendingFollowUps == null && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconLink width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les suggestions de relance font partie du plan Pro.
            </span>
          </div>
          <Link to="/reglages/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      <div className="stat-strip">
        <StatStripItem label="Contacts" value={stats?.totalContacts} />
        <StatStripItem label="Messages / 7j" value={stats?.messagesLast7d} />
        <StatStripItem label="Reçus / 7j" value={stats?.inboundLast7d} />
        <StatStripItem label="Envoyés / 7j" value={stats?.outboundLast7d} />
      </div>

      <div className="row row--between" style={{ marginTop: 8 }}>
        <div className="eyebrow">Statistiques</div>
        {analytics && (
          <button className="btn btn--sm" onClick={exportCsv} disabled={exporting}>
            {exporting ? "Export…" : "Exporter en CSV"}
          </button>
        )}
      </div>
      {exportError && <p className="field-error">{exportError}</p>}

      {analyticsLocked && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconChart width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les statistiques avancées font partie du plan Business.
            </span>
          </div>
          <Link to="/reglages/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      {analytics && (
        <>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Pipeline</div>
            <div className="stat-strip">
              {analytics.funnel.map((f) => (
                <div key={f.status} className="stat-strip__item">
                  <div className="stat-strip__value">{f.count}</div>
                  <div className="stat-strip__label">{STATUS_LABEL[f.status] || f.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card--tight">
            <span className="eyebrow">Temps de réponse moyen</span>
            {analytics.avgResponseTime.sampleSize > 0 ? (
              <>
                <div className="stat__value" style={{ marginTop: 8 }}>{analytics.avgResponseTime.avgMinutes} min</div>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  Basé sur {analytics.avgResponseTime.sampleSize} réponse{analytics.avgResponseTime.sampleSize > 1 ? "s" : ""} (90 derniers jours)
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
        </>
      )}
    </div>
  );
}

function StatStripItem({ label, value }) {
  return (
    <div className="stat-strip__item">
      <div className="stat-strip__value">{value ?? "—"}</div>
      <div className="stat-strip__label">{label}</div>
    </div>
  );
}
