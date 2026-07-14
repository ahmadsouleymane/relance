import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Logomark from "../components/Logomark.jsx";

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function InvoicePublic() {
  const { publicToken } = useParams();
  const [invoice, setInvoice] = useState(undefined);

  useEffect(() => {
    api
      .get(`/public/invoice/${publicToken}`)
      .then(setInvoice)
      .catch(() => setInvoice(null));
  }, [publicToken]);

  if (invoice === undefined) return null;

  if (invoice === null) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <Logomark size={44} />
          <div className="display-2">Facture introuvable</div>
          <p className="text-muted">Ce lien n'est plus valide.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--paper)", padding: "var(--sp-5) var(--sp-4)" }}>
      <div className="stack" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="row" style={{ gap: 10 }}>
          <Logomark size={28} />
          <span className="h1">{invoice.businessName}</span>
        </div>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Facture</div>
          <div className="stack--sm">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="row row--between">
                <span style={{ fontSize: 14 }}>{item.label} × {item.qty}</span>
                <span className="mono" style={{ fontSize: 13.5 }}>{formatFcfa(item.qty * item.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: "14px 0" }} />
          <div className="row row--between">
            <span style={{ fontWeight: 700 }}>Total</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{formatFcfa(invoice.total)}</span>
          </div>

          <button className="btn btn--primary btn--block" type="button" disabled style={{ marginTop: 18, opacity: 0.5, cursor: "not-allowed" }}>
            Payer — bientôt disponible
          </button>
        </div>
      </div>
    </div>
  );
}
