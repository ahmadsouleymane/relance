import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logomark from "../components/Logomark.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
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
        <p className="text-muted">Le carnet client de ton WhatsApp.</p>
      </div>

      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="h1" style={{ marginBottom: 18 }}>Connexion</div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@business.ci" />
        </div>
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-muted" style={{ marginTop: 18, fontSize: 13, textAlign: "center" }}>
          Pas encore de compte ? <Link to="/inscription" style={{ fontWeight: 700, textDecoration: "underline" }}>Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}
