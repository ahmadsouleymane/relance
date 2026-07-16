import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function AdminDisputes() {
  const [orders, setOrders] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/orders/admin/disputes").then((d) => setOrders(d.orders));

  useEffect(() => {
    load();
  }, []);

  const resolve = async (orderId, resolution) => {
    setError("");
    const notes = window.prompt(
      resolution === "rembourse" ? "Notes sur le remboursement au client :" : "Notes sur la libération des fonds au vendeur :"
    );
    if (notes == null) return;
    setBusyId(orderId);
    try {
      await api.post(`/orders/${orderId}/dispute/resolve`, { resolution, notes });
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
      {error && <p className="field-error">{error}</p>}
      {orders.length === 0 && (
        <div className="empty">
          <div className="h2">Aucun litige ouvert</div>
        </div>
      )}
      {orders.map((o) => (
        <div key={o._id} className="card stack--sm">
          <div className="row row--between">
            <strong style={{ fontSize: 14 }}>{o.product?.name}</strong>
            <span className="mono" style={{ fontWeight: 700 }}>{formatFcfa(o.price)}</span>
          </div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Client : {o.buyer?.businessName} ({o.buyer?.email}) — Vendeur : {o.vendor?.businessName} ({o.vendor?.email})
          </div>
          <p style={{ fontSize: 13, background: "var(--paper-raised)", border: "1.5px solid var(--line-soft)", borderRadius: 10, padding: 10 }}>
            « {o.dispute?.reason} »
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--sm btn--primary" type="button" disabled={busyId === o._id} onClick={() => resolve(o._id, "confirme")}>
              Libérer les fonds au vendeur
            </button>
            <button className="btn btn--sm btn--danger" type="button" disabled={busyId === o._id} onClick={() => resolve(o._id, "rembourse")}>
              Rembourser le client
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
