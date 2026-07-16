import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";

const STATUS_LABEL = {
  en_attente_paiement: "En attente de paiement",
  paye: "Payée — à expédier",
  expedie: "Expédiée — en attente de confirmation",
  confirme: "Terminée",
  en_litige: "En litige",
  rembourse: "Remboursée",
};

const STATUS_TONE = {
  en_attente_paiement: "",
  paye: "pill--accent",
  expedie: "pill--accent",
  confirme: "pill--live",
  en_litige: "pill--danger",
  rembourse: "",
};

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Commandes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const as = searchParams.get("as") || "achats";
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    setOrders(null);
    api.get(`/orders?as=${as}`).then((d) => setOrders(d.orders));
  }, [as]);

  return (
    <div className="stack">
      <h1 className="display-2">Commandes</h1>

      <div className="segmented">
        <button type="button" className={as === "achats" ? "is-active" : ""} onClick={() => setSearchParams({ as: "achats" })}>
          Mes achats
        </button>
        <button type="button" className={as === "ventes" ? "is-active" : ""} onClick={() => setSearchParams({ as: "ventes" })}>
          Mes ventes
        </button>
      </div>

      {!orders && <p className="text-muted">Chargement…</p>}
      {orders?.length === 0 && (
        <div className="empty">
          <div className="h2">Aucune commande</div>
          <p>{as === "achats" ? "Tes achats apparaîtront ici." : "Tes ventes apparaîtront ici."}</p>
        </div>
      )}

      {orders?.length > 0 && (
        <div className="stack--sm">
          {orders.map((o) => (
            <Link key={o._id} to={`/commandes/${o._id}`} className="card card--tight card--ticket row row--between">
              <div>
                <strong style={{ fontSize: 14 }}>{o.product?.name}</strong>
                <div className="text-muted" style={{ fontSize: 11.5 }}>
                  {as === "achats" ? o.vendor?.businessName : o.buyer?.businessName}
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

export { STATUS_LABEL, STATUS_TONE, formatFcfa };
