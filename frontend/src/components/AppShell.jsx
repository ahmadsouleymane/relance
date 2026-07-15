import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconHome, IconContacts, IconBox, IconSettings, IconLogout } from "./icons.jsx";
import Logomark from "./Logomark.jsx";

const NAV_ITEMS = [
  { to: "/apercu", label: "Aperçu", icon: IconHome },
  { to: "/conversations", label: "Conversations", icon: IconContacts },
  { to: "/vendre", label: "Vendre", icon: IconBox },
  { to: "/reglages", label: "Réglages", icon: IconSettings },
];

function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/connexion");
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={26} />
          <span className="h1">Relance</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {initialsOf(user?.businessName)}
          </div>
          <button className="btn btn--ghost btn--icon" onClick={handleLogout} aria-label="Se déconnecter">
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </header>

      <nav className="tab-bar">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tab-bar__link${isActive ? " is-active" : ""}`}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
            style={{ position: "relative" }}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="bottom-nav__dot" />}
                <Icon />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
