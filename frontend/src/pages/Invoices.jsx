import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { IconPlus, IconX, IconCheck } from "../components/icons.jsx";

const STATUS_LABEL = { draft: "Brouillon", sent: "Envoyée", paid: "Payée" };

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

const EMPTY_ITEM = { label: "", qty: 1, unitPrice: 0 };

export default function Invoices() {
  const [invoices, setInvoices] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState("");
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const load = () => api.get("/invoices").then((d) => setInvoices(d.invoices));

  useEffect(() => {
    load();
    api.get("/contacts").then((d) => setContacts(d.contacts)).catch(() => {});
  }, []);

  const total = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);

  const updateItem = (idx, patch) => {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((its) => [...its, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((its) => its.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (items.some((i) => !i.label.trim())) return setError("Chaque article doit avoir un nom");

    try {
      await api.post("/invoices", {
        contact: contactId || undefined,
        items: items.map((i) => ({ label: i.label.trim(), qty: Number(i.qty), unitPrice: Number(i.unitPrice) })),
      });
      setItems([{ ...EMPTY_ITEM }]);
      setContactId("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async (id) => {
    await api.post(`/invoices/${id}/send`, {});
    load();
  };

  const copyLink = (invoice) => {
    const url = `${window.location.origin}/f/${invoice.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invoice._id);
    setTimeout(() => setCopiedId(""), 1500);
  };

  return (
    <div className="stack">
      <h1 className="display-2">Factures</h1>
      <p className="text-muted" style={{ fontSize: 13.5 }}>
        Crée une facture, copie le lien et colle-le dans la conversation WhatsApp du client.
      </p>

      <form onSubmit={submit} className="card card--tight stack--sm">
        <div className="field">
          <label>Client (optionnel)</label>
          <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">— Sans contact —</option>
            {contacts.map((c) => (
              <option key={c._id} value={c._id}>{c.displayName || c.phoneNumber}</option>
            ))}
          </select>
        </div>

        <div className="stack--sm">
          {items.map((item, idx) => (
            <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
              <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                {idx === 0 && <label>Article</label>}
                <input value={item.label} onChange={(e) => updateItem(idx, { label: e.target.value })} placeholder="Ex : Robe wax bleue" />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                {idx === 0 && <label>Qté</label>}
                <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, { qty: e.target.value })} />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                {idx === 0 && <label>Prix unitaire</label>}
                <input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
              </div>
              {items.length > 1 && (
                <button type="button" className="btn btn--ghost btn--icon" onClick={() => removeItem(idx)} aria-label="Retirer">
                  <IconX width={16} height={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="btn btn--ghost btn--sm" onClick={addItem} style={{ alignSelf: "flex-start" }}>
          <IconPlus width={14} height={14} /> Ajouter un article
        </button>

        <div className="row row--between" style={{ marginTop: 8 }}>
          <span className="text-muted" style={{ fontSize: 13 }}>Total</span>
          <span className="mono" style={{ fontWeight: 700 }}>{formatFcfa(total)}</span>
        </div>

        {error && <p className="field-error">{error}</p>}

        <button className="btn btn--primary" type="submit">Créer la facture</button>
      </form>

      {!invoices && <p className="text-muted">Chargement…</p>}
      {invoices?.length === 0 && (
        <div className="empty">
          <div className="h2">Aucune facture</div>
          <p>Crée ta première facture pour un client.</p>
        </div>
      )}

      {invoices?.length > 0 && (
        <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
          {invoices.map((inv) => (
            <li key={inv._id} className="row row--between" style={{ padding: "12px 4px", borderBottom: "1.5px solid var(--line-soft)" }}>
              <div>
                <div className="mono" style={{ fontWeight: 700 }}>{formatFcfa(inv.total)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {inv.items.length} article{inv.items.length > 1 ? "s" : ""} · <span className="pill" style={{ fontSize: 10.5 }}>{STATUS_LABEL[inv.status]}</span>
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => copyLink(inv)}>
                  {copiedId === inv._id ? <><IconCheck width={14} height={14} /> Copié</> : "Copier le lien"}
                </button>
                {inv.status === "draft" && (
                  <button type="button" className="btn btn--live btn--sm" onClick={() => send(inv._id)}>
                    Marquer envoyée
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
