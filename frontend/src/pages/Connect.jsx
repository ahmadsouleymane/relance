import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

const STATUS_LABEL = {
  connected: "Connecté",
  connecting: "En attente du scan…",
  disconnected: "Déconnecté",
};

export default function Connect() {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [historySyncStatus, setHistorySyncStatus] = useState("idle");
  const [historySyncedCount, setHistorySyncedCount] = useState(0);
  const pollRef = useRef(null);

  const poll = useCallback(async () => {
    const s = await api.get("/whatsapp/status").catch(() => null);
    if (!s) return;
    setStatus(s.status);
    setPhoneNumber(s.phoneNumber);
    setHistorySyncStatus(s.historySyncStatus || "idle");
    setHistorySyncedCount(s.historySyncedCount || 0);
    if (s.status === "connecting") {
      const q = await api.get("/whatsapp/qr").catch(() => null);
      setQr(q?.qr || null);
    } else {
      setQr(null);
    }
  }, []);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [poll]);

  const connect = async () => {
    setStatus("connecting");
    await api.post("/whatsapp/connect", {});
    poll();
  };

  const disconnect = async () => {
    await api.post("/whatsapp/disconnect", {});
    setStatus("disconnected");
    setQr(null);
  };

  return (
    <div className="stack">
      <h1 className="display-2">WhatsApp</h1>

      <div className="status-banner">
        <span className={`status-dot status-dot--${status || "disconnected"}`} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{STATUS_LABEL[status] || "…"}</div>
          {phoneNumber && <div className="text-muted mono" style={{ fontSize: 12 }}>+{phoneNumber}</div>}
        </div>
        {status === "connected" ? (
          <button className="btn btn--sm btn--danger" onClick={disconnect}>Déconnecter</button>
        ) : status !== "connecting" ? (
          <button className="btn btn--sm btn--live" onClick={connect}>Connecter</button>
        ) : null}
      </div>

      {status === "connected" && historySyncStatus === "syncing" && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="skeleton" style={{ width: 16, height: 16, borderRadius: "50%" }} />
          <p style={{ fontSize: 13, fontWeight: 600 }}>
            Import de l'historique en cours… ({historySyncedCount} message{historySyncedCount > 1 ? "s" : ""} importé
            {historySyncedCount > 1 ? "s" : ""})
          </p>
        </div>
      )}

      {status === "connecting" && (
        <div className="card" style={{ textAlign: "center" }}>
          {qr ? (
            <div className="qr-frame"><img src={qr} alt="QR code WhatsApp" /></div>
          ) : (
            <div className="qr-frame"><div className="skeleton" style={{ width: "90%", height: "90%" }} /></div>
          )}
          <p className="text-muted" style={{ fontSize: 12.5, marginTop: 12 }}>Le code se rafraîchit automatiquement.</p>
        </div>
      )}

      {status !== "connected" && (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Comment scanner</div>
          <div className="step-list">
            <Step n={1}>Ouvre WhatsApp sur ton téléphone.</Step>
            <Step n={2}>Va dans Paramètres → Appareils liés → Lier un appareil.</Step>
            <Step n={3}>Scanne le QR code affiché ici.</Step>
          </div>
        </div>
      )}

      <div className="card" style={{ background: "var(--live-tint)", borderColor: "var(--live-ink)" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--live-ink)" }}>
          DJASSA ne fait jamais d'envoi automatique. On lit tes conversations pour construire ton historique et te
          suggérer qui relancer — c'est toujours toi qui écris et qui envoies, depuis ton téléphone.
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="step">
      <span className="step__num">{n}</span>
      <p style={{ fontSize: 13.5, paddingTop: 3 }}>{children}</p>
    </div>
  );
}
