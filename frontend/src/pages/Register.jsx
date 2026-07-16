import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logomark from "../components/Logomark.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: "", email: "", phone: "", password: "", accountType: "client" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate(form.accountType === "vendeur" ? "/verification" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen market-weave">
      <div className="auth-brand">
        <Logomark size={44} />
        <div className="display-2">DJASSA</div>
        <p className="text-muted">7 jours d'essai gratuit, sans carte.</p>
      </div>

      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="h1" style={{ marginBottom: 18 }}>Créer un compte</div>

        <div className="field">
          <label htmlFor="accountType">Je m'inscris comme</label>
          <div className="row" style={{ gap: 8 }} id="accountType">
            <button
              type="button"
              className={`btn ${form.accountType === "client" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setForm((f) => ({ ...f, accountType: "client" }))}
            >
              Client — j'achète
            </button>
            <button
              type="button"
              className={`btn ${form.accountType === "vendeur" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setForm((f) => ({ ...f, accountType: "vendeur" }))}
            >
              Vendeur — je vends
            </button>
          </div>
          {form.accountType === "vendeur" && (
            <p className="text-muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              Une vérification de pièce d'identité sera demandée juste après l'inscription, avant de pouvoir recevoir des commandes.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="businessName">{form.accountType === "vendeur" ? "Nom de ta boutique" : "Ton nom"}</label>
          <input id="businessName" required value={form.businessName} onChange={set("businessName")} placeholder={form.accountType === "vendeur" ? "Pharmacie du Plateau" : "Aïcha Koné"} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="toi@example.ci" />
        </div>
        <div className="field">
          <label htmlFor="phone">Téléphone</label>
          <input id="phone" value={form.phone} onChange={set("phone")} placeholder="+225 07 00 00 00 00" />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="8 caractères minimum" />
        </div>

        {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Création…" : "Créer mon compte"}
        </button>

        <p className="text-muted" style={{ marginTop: 18, fontSize: 13, textAlign: "center" }}>
          Déjà un compte ? <Link to="/connexion" style={{ fontWeight: 700, textDecoration: "underline" }}>Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
