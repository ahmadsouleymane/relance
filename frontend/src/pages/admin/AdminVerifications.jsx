import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

export default function AdminVerifications() {
  const [users, setUsers] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/verification/admin/pending").then((d) => setUsers(d.users));

  useEffect(() => {
    load();
  }, []);

  const review = async (userId, approve) => {
    setError("");
    let rejectionReason;
    if (!approve) {
      rejectionReason = window.prompt("Motif du refus (visible par le vendeur) :") || "";
      if (!rejectionReason.trim()) return;
    }
    setBusyId(userId);
    try {
      await api.post(`/verification/admin/${userId}/review`, { approve, rejectionReason });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!users) return <p className="text-muted">Chargement…</p>;

  return (
    <div className="stack">
      {error && <p className="field-error">{error}</p>}
      {users.length === 0 && (
        <div className="empty">
          <div className="h2">Aucune vérification en attente</div>
        </div>
      )}
      {users.map((u) => (
        <div key={u._id} className="card card--tight row row--between">
          <div>
            <strong style={{ fontSize: 14 }}>{u.businessName}</strong>
            <div className="text-muted" style={{ fontSize: 12 }}>{u.email} · {u.phone}</div>
            {u.sellerVerification?.idDocumentUrl && (
              <a href={u.sellerVerification.idDocumentUrl} target="_blank" rel="noreferrer" className="text-muted" style={{ fontSize: 12, textDecoration: "underline" }}>
                Voir la pièce d'identité
              </a>
            )}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn--sm btn--primary" type="button" disabled={busyId === u._id} onClick={() => review(u._id, true)}>
              Approuver
            </button>
            <button className="btn btn--sm btn--danger" type="button" disabled={busyId === u._id} onClick={() => review(u._id, false)}>
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
