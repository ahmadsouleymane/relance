import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const TABS = [
  { to: "", label: "Aperçu", end: true },
  { to: "verifications", label: "Vérifications" },
  { to: "litiges", label: "Litiges" },
  { to: "paiements", label: "Paiements" },
  { to: "commandes", label: "Commandes" },
  { to: "utilisateurs", label: "Utilisateurs" },
];

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/apercu" replace />;

  return (
    <div className="stack">
      <h1 className="display-2">Administration</h1>

      <div className="segmented" style={{ flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? "is-active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
