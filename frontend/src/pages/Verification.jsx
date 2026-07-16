import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const STATUS_LABEL = {
  non_soumise: "Aucune pièce soumise",
  en_attente: "En cours de vérification",
  approuvee: "Compte vérifié",
  rejetee: "Vérification refusée",
};

export default function Verification() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/verification/status").then((d) => setStatus(d.sellerVerification));

  useEffect(() => {
    load();
  }, []);

  const submit = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { uploadUrl, publicUrl } = await api.post("/uploads", { contentType: file.type });
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Échec de l'envoi du document");
      await api.post("/verification/submit", { idDocumentUrl: publicUrl });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!status) return null;

  return (
    <div className="auth-screen">
      <div className="card auth-card stack">
        <div className="h1">Vérification d'identité</div>
        <p className="text-muted" style={{ fontSize: 13.5 }}>
          Pour protéger les clients de DJASSA, chaque vendeur doit être identifié avant de pouvoir recevoir des
          commandes. Envoie une photo lisible de ta pièce d'identité (CNI, passeport, permis).
        </p>

        <div className={status.status === "approuvee" ? "stamp" : "pill"}>{STATUS_LABEL[status.status]}</div>

        {status.status === "rejetee" && status.rejectionReason && (
          <p className="field-error">{status.rejectionReason}</p>
        )}

        {(status.status === "non_soumise" || status.status === "rejetee") && (
          <label className="btn btn--primary btn--block" style={{ cursor: "pointer", textAlign: "center" }}>
            {uploading ? "Envoi…" : "Envoyer ma pièce d'identité"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) submit(file);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {status.status === "en_attente" && (
          <p className="text-muted" style={{ fontSize: 13 }}>
            Ta pièce est en cours de revue. Tu peux déjà préparer ton catalogue — il ne sera visible sur le marché
            qu'une fois ton compte vérifié.
          </p>
        )}

        {error && <p className="field-error">{error}</p>}

        <button className="btn btn--ghost btn--block" type="button" onClick={() => navigate("/")}>
          Continuer vers mon compte
        </button>
      </div>
    </div>
  );
}
