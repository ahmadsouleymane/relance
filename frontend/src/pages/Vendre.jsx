import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "catalogue", label: "Catalogue" },
  { to: "factures", label: "Factures" },
];

export default function Vendre() {
  return (
    <div className="stack">
      <h1 className="display-2">Vendre</h1>
      <div className="segmented">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? "is-active" : "")}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
