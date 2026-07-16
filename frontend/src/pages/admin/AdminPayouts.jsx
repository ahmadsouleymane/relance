import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function AdminPayouts() {
  const [orders, setOrders] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/orders/admin/payouts").then((d) => setOrders(d.orders));

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (orderId) => {
    setError("");
    setBusyId(orderId);
    try {
      await api.post(`/orders/${orderId}/payout/mark-paid`, {});
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!orders) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="stack">
      <p className="text-muted" style={{ fontSize: 12.5 }}>
        Le reversement au vendeur (Mobile Money) se fait manuellement pour l'instant — clique "Marqué payé" une fois
        le transfert effectué.
      </p>
      {error && <p className="field-error">{error}</p>}
      {orders.length === 0 && (
        <div className="empty">
          <div className="h2">Aucun paiement en attente</div>
        </div>
      )}
      {orders.map((o) => (
        <div key={o._id} className="card card--tight row row--between">
          <div>
            <strong style={{ fontSize: 14 }}>{o.vendor?.businessName}</strong>
            <div className="text-muted" style={{ fontSize: 12 }}>{o.vendor?.phone} — {o.product?.name}</div>
          </div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <span className="mono" style={{ fontWeight: 700 }}>{formatFcfa(o.netAmount)}</span>
            <button className="btn btn--sm btn--primary" type="button" disabled={busyId === o._id} onClick={() => markPaid(o._id)}>
              Marqué payé
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
