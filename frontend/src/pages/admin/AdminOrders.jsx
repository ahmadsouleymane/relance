import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { STATUS_LABEL, STATUS_TONE, formatFcfa } from "../Commandes.jsx";

const STATUSES = Object.keys(STATUS_LABEL);

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setOrders(null);
    api.get(`/admin/orders${status ? `?status=${status}` : ""}`).then((d) => setOrders(d.orders));
  }, [status]);

  return (
    <div className="stack">
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 260, height: 38, borderRadius: 10, border: "1.5px solid var(--line-soft)", padding: "0 10px" }}>
        <option value="">Tous les statuts</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>

      {!orders && <p className="text-muted">Chargement…</p>}
      {orders?.length === 0 && (
        <div className="empty">
          <div className="h2">Aucune commande</div>
        </div>
      )}
      {orders?.length > 0 && (
        <div className="stack--sm">
          {orders.map((o) => (
            <Link key={o._id} to={`/commandes/${o._id}`} className="card card--tight row row--between">
              <div>
                <strong style={{ fontSize: 14 }}>{o.product?.name}</strong>
                <div className="text-muted" style={{ fontSize: 11.5 }}>
                  {o.buyer?.businessName} → {o.vendor?.businessName}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontWeight: 700 }}>{formatFcfa(o.price)}</div>
                <span className={`pill ${STATUS_TONE[o.status]}`} style={{ fontSize: 10.5 }}>{STATUS_LABEL[o.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
