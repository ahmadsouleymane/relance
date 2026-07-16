import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

const CARDS = [
  { key: "pendingVerifications", label: "Vérifications en attente", to: "../verifications" },
  { key: "openDisputes", label: "Litiges ouverts", to: "../litiges" },
  { key: "pendingPayouts", label: "Paiements à reverser", to: "../paiements" },
  { key: "totalOrders", label: "Commandes au total", to: "../commandes" },
  { key: "totalUsers", label: "Comptes au total", to: "../utilisateurs" },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(setStats);
  }, []);

  if (!stats) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="product-grid">
      {CARDS.map((c) => (
        <Link key={c.key} to={c.to} className="card card--tight">
          <div className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{stats[c.key]}</div>
          <div className="text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{c.label}</div>
        </Link>
      ))}
    </div>
  );
}
