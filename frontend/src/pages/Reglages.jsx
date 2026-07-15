import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLink, IconCard, IconBox, IconLogout, IconCheck, IconArrowRight, IconReceipt } from "../components/icons.jsx";

const MENU = [
  { to: "whatsapp", label: "Connexion WhatsApp", icon: IconLink },
  { to: "abonnement", label: "Abonnement", icon: IconCard },
];

export default function Reglages() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(user?.storeSlug || "");
  const [slugError, setSlugError] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const atIndex = location.pathname === "/reglages";
  const storeUrl = `${window.location.origin}/v/${user?.storeSlug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveSlug = async (e) => {
    e.preventDefault();
    setSlugError("");
    setSavingSlug(true);
    try {
      const data = await api.patch("/auth/store-slug", { storeSlug: slug });
      setUser(data.user);
    } catch (err) {
      setSlugError(err.message);
    } finally {
      setSavingSlug(false);
    }
  };

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

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  if (!atIndex) {
    return (
      <div className="stack">
        <Link to="/reglages" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          ← Réglages
        </Link>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="display-2">Réglages</h1>

      <div className="card card--tight">
        <span className="eyebrow">Ma vitrine</span>
        <p className="text-muted" style={{ fontSize: 12.5, marginTop: 4, marginBottom: 10 }}>
          Le lien que tu partages avec tes clients pour qu'ils voient ton catalogue.
        </p>
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {storeUrl}
          </span>
          <button className="btn btn--ghost btn--sm" type="button" onClick={copyStoreLink}>
            {copied ? <><IconCheck width={14} height={14} /> Copié</> : "Copier"}
          </button>
        </div>
        <form onSubmit={saveSlug} className="row" style={{ gap: 8 }}>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="nom-de-ta-boutique"
            style={{ flex: 1, height: 40, borderRadius: 10, border: "1.5px solid var(--line-soft)", padding: "0 12px", fontSize: 13 }}
          />
          <button className="btn btn--sm" type="submit" disabled={savingSlug || slug === user?.storeSlug}>
            {savingSlug ? "…" : "Modifier"}
          </button>
        </form>
        {slugError && <p className="field-error" style={{ marginTop: 8 }}>{slugError}</p>}
      </div>

      <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
        {MENU.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="contact-row">
              <Icon width={20} height={20} />
              <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
              <IconArrowRight width={16} height={16} />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="contact-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
          >
            <IconReceipt width={20} height={20} />
            <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>
              {exporting ? "Export en cours…" : "Exporter mes contacts (CSV)"}
            </span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={handleLogout}
            className="contact-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", color: "var(--danger)" }}
          >
            <IconLogout width={20} height={20} />
            <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>Déconnexion</span>
          </button>
        </li>
      </ul>
      {exportError && <p className="field-error">{exportError}</p>}
    </div>
  );
}
