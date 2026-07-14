import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowRight, IconBell, IconLink, IconChart } from "../components/icons.jsx";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [digest, setDigest] = useState(null);

  useEffect(() => {
    api.get("/stats/dashboard").then(setStats).catch(() => {});
    api.get("/whatsapp/status").then(setWaStatus).catch(() => {});
    api.get("/digest/weekly").then(setDigest).catch(() => {});
  }, []);

  return (
    <div className="stack">
      <div>
        <span className="eyebrow">{user?.businessName}</span>
        <h1 className="display-2">Aujourd'hui</h1>
      </div>

      {waStatus && waStatus.status !== "connected" && (
        <Link to="/connexion-whatsapp" className="briefing-alert">
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
        <Link to="/relances" className="suggestion-card suggestion-card--attention" style={{ textDecoration: "none" }}>
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
          <Link to="/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      {stats?.analyticsEnabled && (
        <Link to="/analytiques" className="suggestion-card suggestion-card--info" style={{ textDecoration: "none" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 10 }}>
              <IconChart width={20} height={20} />
              <span style={{ fontWeight: 600 }}>Voir mes statistiques</span>
            </div>
            <IconArrowRight width={18} height={18} />
          </div>
        </Link>
      )}

      {stats && !stats.analyticsEnabled && (
        <div className="card row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 10 }}>
            <IconChart width={18} height={18} />
            <span className="text-muted" style={{ fontSize: 13.5 }}>
              Les statistiques font partie du plan Business.
            </span>
          </div>
          <Link to="/abonnement" className="btn btn--sm">Voir les plans</Link>
        </div>
      )}

      <div className="stat-strip">
        <StatStripItem label="Contacts" value={stats?.totalContacts} />
        <StatStripItem label="Messages / 7j" value={stats?.messagesLast7d} />
        <StatStripItem label="Reçus / 7j" value={stats?.inboundLast7d} />
        <StatStripItem label="Envoyés / 7j" value={stats?.outboundLast7d} />
      </div>
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
