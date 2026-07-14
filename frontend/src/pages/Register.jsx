import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logomark from "../components/Logomark.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <Logomark size={44} />
        <div className="display-2">Relance</div>
        <p className="text-muted">7 jours d'essai gratuit, sans carte.</p>
      </div>

      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="h1" style={{ marginBottom: 18 }}>Créer un compte</div>

        <div className="field">
          <label htmlFor="businessName">Nom de ton business</label>
          <input id="businessName" required value={form.businessName} onChange={set("businessName")} placeholder="Pharmacie du Plateau" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="toi@business.ci" />
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
