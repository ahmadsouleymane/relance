import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Logomark from "../components/Logomark.jsx";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Storefront() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState(undefined);

  useEffect(() => {
    api
      .get(`/public/${storeSlug}`)
      .then(setStore)
      .catch(() => setStore(null));
  }, [storeSlug]);

  if (store === undefined) return null;

  if (store === null) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <Logomark size={44} />
          <div className="display-2">Boutique introuvable</div>
          <p className="text-muted">Ce lien ne correspond à aucune vitrine active.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--paper)", padding: "var(--sp-5) var(--sp-4)" }}>
      <div className="stack" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={32} />
          <h1 className="display-2">{store.businessName}</h1>
        </div>

        {store.products.length === 0 && (
          <div className="empty">
            <p>Aucun produit disponible pour le moment.</p>
          </div>
        )}

        {store.products.length > 0 && (
          <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
            {store.products.map((p) => (
              <div key={p._id} className="card card--tight" style={{ width: 220 }}>
                {p.photos?.[0] ? (
                  <img src={p.photos[0]} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />
                ) : (
                  <div className="skeleton" style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }} />
                )}
                <strong style={{ fontSize: 14 }}>{p.name}</strong>
                <div className="mono" style={{ fontSize: 13, marginTop: 2 }}>{formatFcfa(p.price)}</div>
                {p.description && (
                  <p className="text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{p.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 24 }}>
          Propulsé par Relance
        </p>
      </div>
    </div>
  );
}
