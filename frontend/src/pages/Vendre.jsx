import { NavLink, Outlet, useLocation } from "react-router-dom";
import { IconBox, IconReceipt } from "../components/icons.jsx";

const TABS = [
  { to: "catalogue", label: "Catalogue", icon: IconBox, hint: "Tes produits, photos et prix — ta vitrine en ligne." },
  { to: "factures", label: "Factures", icon: IconReceipt, hint: "Facture tes ventes et partage le lien de paiement." },
];

export default function Vendre() {
  const location = useLocation();
  const active = TABS.find((t) => location.pathname.startsWith(`/vendre/${t.to}`)) || TABS[0];

  return (
    <div className="stack">
      <h1 className="display-2">Vendre</h1>

      <div className="segmented" style={{ width: "100%" }}>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} style={{ flex: 1, justifyContent: "center" }} className={({ isActive }) => (isActive ? "is-active" : "")}>
            <t.icon width={15} height={15} />
            {t.label}
          </NavLink>
        ))}
      </div>

      <p className="text-muted" style={{ fontSize: 12.5, marginTop: -8 }}>{active.hint}</p>

      <Outlet />
    </div>
  );
}
