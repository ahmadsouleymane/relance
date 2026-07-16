import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import { STATUS_LABEL, STATUS_TONE, formatFcfa } from "./Commandes.jsx";

export default function CommandeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);

  const load = () => api.get(`/orders/${id}`).then((d) => setOrder(d.order));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = (payload) => {
      if (payload.orderId === id) load();
    };
    ["order:paid", "order:shipped", "order:confirmed", "order:disputed", "order:dispute_resolved"].forEach((evt) =>
      socket.on(evt, onUpdate)
    );
    return () => {
      ["order:paid", "order:shipped", "order:confirmed", "order:disputed", "order:dispute_resolved"].forEach((evt) =>
        socket.off(evt, onUpdate)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!order) return <p className="text-muted">Chargement…</p>;

  const isBuyer = order.buyer._id === user?._id;
  const isVendor = order.vendor._id === user?._id;

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const payer = () =>
    run(async () => {
      const { checkoutUrl } = await api.post(`/orders/${id}/checkout`, {});
      window.location.href = checkoutUrl;
    });

  const verifierPaiement = () => run(() => api.get(`/orders/${id}/checkout/status`));
  const marquerExpedie = () => run(() => api.post(`/orders/${id}/ship`, {}));
  const confirmerReception = () => run(() => api.post(`/orders/${id}/confirm`, {}));
  const signalerProbleme = () =>
    run(async () => {
      if (!disputeReason.trim()) throw new Error("Décris le problème rencontré");
      await api.post(`/orders/${id}/dispute`, { reason: disputeReason.trim() });
      setDisputeOpen(false);
    });

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <h1 className="display-2">Commande</h1>

      <div className="card stack--sm">
        <div className="row row--between">
          <strong style={{ fontSize: 15 }}>{order.product?.name}</strong>
          <span className={`pill ${STATUS_TONE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
        </div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{formatFcfa(order.price)}</div>
        <div className="text-muted" style={{ fontSize: 12.5 }}>
          {isBuyer ? `Vendeur : ${order.vendor.businessName}` : `Client : ${order.buyer.businessName}`}
        </div>
        {isVendor && (
          <div className="text-muted" style={{ fontSize: 12.5 }}>
            Commission : {formatFcfa(order.commissionAmount)} · Net à recevoir : {formatFcfa(order.netAmount)}
          </div>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      {isBuyer && order.status === "en_attente_paiement" && (
        <div className="card stack--sm">
          <p className="text-muted" style={{ fontSize: 13 }}>
            Votre argent reste protégé jusqu'à ce que vous confirmiez avoir reçu le produit.
          </p>
          <button className="btn btn--primary btn--block" type="button" disabled={busy} onClick={payer}>
            {busy ? "…" : "Payer"}
          </button>
          {order.payment?.reference && (
            <button className="btn btn--ghost btn--sm" type="button" disabled={busy} onClick={verifierPaiement}>
              Vérifier mon paiement
            </button>
          )}
        </div>
      )}

      {isVendor && order.status === "paye" && (
        <div className="card stack--sm">
          <p className="text-muted" style={{ fontSize: 13 }}>
            Le client a payé. Expédie ou remets le produit, puis confirme ici — le client recevra un code à te
            communiquer une fois le produit en main.
          </p>
          <button className="btn btn--primary btn--block" type="button" disabled={busy} onClick={marquerExpedie}>
            {busy ? "…" : "Marquer comme expédié"}
          </button>
        </div>
      )}

      {isBuyer && order.status === "expedie" && (
        <div className="card stack--sm">
          <p className="text-muted" style={{ fontSize: 13 }}>Code à communiquer au vendeur une fois le produit reçu :</p>
          <div className="mono" style={{ fontSize: 22, fontWeight: 800, textAlign: "center", letterSpacing: 2 }}>
            {order.confirmationCode}
          </div>
          <button className="btn btn--primary btn--block" type="button" disabled={busy} onClick={confirmerReception}>
            {busy ? "…" : "Confirmer la réception"}
          </button>
          {!disputeOpen ? (
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setDisputeOpen(true)}>
              Signaler un problème
            </button>
          ) : (
            <div className="stack--sm">
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Décris le problème (colis non reçu, produit différent…)"
                rows={3}
              />
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn--danger btn--sm" type="button" disabled={busy} onClick={signalerProbleme}>
                  Envoyer le signalement
                </button>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => setDisputeOpen(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {order.status === "en_litige" && (
        <div className="card stack--sm">
          <p style={{ fontWeight: 700, fontSize: 13.5 }}>Litige en cours</p>
          <p className="text-muted" style={{ fontSize: 13 }}>{order.dispute?.reason}</p>
          <p className="text-muted" style={{ fontSize: 12 }}>Notre équipe va examiner la commande et trancher.</p>
        </div>
      )}

      {order.status === "confirme" && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: 13.5 }}>Commande terminée</p>
        </div>
      )}

      {order.status === "rembourse" && (
        <div className="card">
          <p style={{ fontWeight: 700, fontSize: 13.5 }}>Commande remboursée</p>
        </div>
      )}
    </div>
  );
}
