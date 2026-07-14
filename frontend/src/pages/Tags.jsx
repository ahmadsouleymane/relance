import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconX, IconPlus } from "../components/icons.jsx";

const SWATCHES = ["#ff6a1a", "#22c35e", "#e0402b", "#2b6ee0", "#a02be0", "#17140f"];

export default function Tags() {
  const [tags, setTags] = useState(null);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [error, setError] = useState("");

  const load = () => api.get("/tags").then((d) => setTags(d.tags));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    if (!label.trim()) return;
    try {
      await api.post("/tags", { label, color });
      setLabel("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api.delete(`/tags/${id}`);
    load();
  };

  return (
    <div className="stack">
      <Link to="/contacts" className="text-muted" style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
        ← Contacts
      </Link>
      <h1 className="display-2">Tags</h1>
      <p className="text-muted" style={{ fontSize: 13.5 }}>
        Classe tes clients : acheteur, curieux, VIP, litige… tout ce qui t'aide à t'y retrouver.
      </p>

      <form onSubmit={create} className="card card--tight">
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          {SWATCHES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setColor(s)}
              style={{
                width: 26, height: 26, borderRadius: 999, background: s,
                border: color === s ? "2.5px solid var(--ink)" : "1.5px solid var(--line-soft)",
                cursor: "pointer",
              }}
              aria-label={s}
            />
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nom du tag (ex: VIP)"
            style={{ flex: 1, height: 44, borderRadius: 12, border: "1.5px solid var(--line-soft)", padding: "0 12px" }}
          />
          <button className="btn btn--primary btn--icon" type="submit"><IconPlus width={18} height={18} /></button>
        </div>
        {error && <p className="field-error" style={{ marginTop: 8 }}>{error}</p>}
      </form>

      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {tags?.map((t) => (
          <span key={t._id} className="tag-chip">
            <span className="tag-swatch" style={{ background: t.color }} />
            {t.label}
            <button type="button" onClick={() => remove(t._id)} aria-label={`Supprimer ${t.label}`}>
              <IconX width={12} height={12} />
            </button>
          </span>
        ))}
        {tags?.length === 0 && <span className="text-muted" style={{ fontSize: 13 }}>Aucun tag pour l'instant.</span>}
      </div>
    </div>
  );
}
