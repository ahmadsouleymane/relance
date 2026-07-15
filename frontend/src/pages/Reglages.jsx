import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLink, IconCard, IconBox, IconLogout, IconCheck, IconArrowRight } from "../components/icons.jsx";

const MENU = [
  { to: "whatsapp", label: "Connexion WhatsApp", icon: IconLink },
  { to: "abonnement", label: "Abonnement", icon: IconCard },
];

export default function Reglages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const atIndex = location.pathname === "/reglages";

  const copyStoreLink = () => {
    const url = `${window.location.origin}/v/${user?.storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            onClick={copyStoreLink}
            className="contact-row"
            style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
          >
            <IconBox width={20} height={20} />
            <span className="contact-row__body" style={{ fontWeight: 700, fontSize: 14 }}>
              {copied ? "Lien copié !" : "Lien de ma vitrine"}
            </span>
            {copied ? <IconCheck width={16} height={16} /> : <IconArrowRight width={16} height={16} />}
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
    </div>
  );
}
