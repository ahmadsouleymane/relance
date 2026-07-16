import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { IconBox, IconSearch, IconCheck } from "../components/icons.jsx";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = (query) => {
    api
      .get(`/public/marketplace/products${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((d) => setProducts(d.products));
  };

  useEffect(() => {
    load("");
  }, []);

  const contact = async (product) => {
    setError("");
    try {
      const { conversation } = await api.post("/conversations", { productId: product._id });
      navigate(`/messagerie/${conversation._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="row row--between">
        <h1 className="display-2">Marché</h1>
        <span className="stamp">
          <IconCheck width={13} height={13} /> Vendeurs vérifiés
        </span>
      </div>
      <p className="text-muted" style={{ fontSize: 13.5 }}>
        Discute, négocie, et paie en toute confiance : votre argent reste bloqué en séquestre jusqu'à ce que vous
        ayez le produit en main.
      </p>

      <form
        className="row"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" />
        </div>
        <button className="btn btn--ghost btn--icon" type="submit" aria-label="Rechercher">
          <IconSearch width={18} height={18} />
        </button>
      </form>

      {error && <p className="field-error">{error}</p>}

      {!products && <p className="text-muted">Chargement…</p>}
      {products?.length === 0 && (
        <div className="empty">
          <div className="h2">Aucun produit pour l'instant</div>
          <p>Reviens bientôt — les vendeurs vérifiés arrivent progressivement sur DJASSA.</p>
        </div>
      )}

      {products?.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p._id} className="card card--tight card--ticket">
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
              <div className="text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>{p.vendor?.businessName}</div>
              <div className="mono" style={{ fontSize: 14, marginTop: 4, fontWeight: 700, color: "var(--accent-ink)" }}>
                {formatFcfa(p.price)}
              </div>
              <button className="btn btn--primary btn--sm btn--block" style={{ marginTop: 10 }} type="button" onClick={() => contact(p)}>
                Contacter le vendeur
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
