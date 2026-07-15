import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { IconBox, IconWhatsapp } from "../components/icons.jsx";
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
    <div style={{ minHeight: "100%", background: "var(--paper)" }}>
      <header
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "var(--sp-6) var(--sp-4) var(--sp-5)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Logomark size={30} />
        </div>
        <h1 className="display-1" style={{ color: "var(--paper)" }}>{store.businessName}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 6 }}>
          {store.products.length} produit{store.products.length > 1 ? "s" : ""} disponible{store.products.length > 1 ? "s" : ""}
        </p>
      </header>

      <div className="stack" style={{ maxWidth: 900, margin: "0 auto", padding: "var(--sp-5) var(--sp-4) var(--sp-7)" }}>
        {store.products.length === 0 && (
          <div className="empty">
            <div className="h2">Bientôt disponible</div>
            <p>Cette boutique n'a pas encore ajouté de produit.</p>
          </div>
        )}

        {store.products.length > 0 && (
          <div className="product-grid">
            {store.products.map((p) => (
              <div key={p._id} className="card card--tight">
                {p.photos?.[0] ? (
                  <img
                    src={p.photos[0]}
                    alt={p.name}
                    style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10, marginBottom: 10 }}
                  />
                ) : (
                  <div className="photo-placeholder" style={{ width: "100%", height: 150, borderRadius: 10, marginBottom: 10 }}>
                    <IconBox width={30} height={30} />
                  </div>
                )}
                <strong style={{ fontSize: 14.5 }}>{p.name}</strong>
                <div className="mono" style={{ fontSize: 14, marginTop: 4, fontWeight: 700, color: "var(--accent-ink)" }}>
                  {formatFcfa(p.price)}
                </div>
                {p.description && (
                  <p className="text-muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.4 }}>{p.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div className="row" style={{ gap: 6, color: "var(--ink-soft)", fontSize: 12 }}>
            <IconWhatsapp width={14} height={14} />
            <span>Pour commander, contacte {store.businessName} directement sur WhatsApp.</span>
          </div>
          <span className="text-muted" style={{ fontSize: 11 }}>Propulsé par Relance</span>
        </footer>
      </div>
    </div>
  );
}
