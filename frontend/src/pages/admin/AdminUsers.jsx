import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { IconSearch } from "../../components/icons.jsx";

const VERIFICATION_LABEL = {
  non_soumise: "Non soumise",
  en_attente: "En attente",
  approuvee: "Vérifié",
  rejetee: "Refusé",
};

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");

  const load = (query) => api.get(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`).then((d) => setUsers(d.users));

  useEffect(() => {
    load("");
  }, []);

  return (
    <div className="stack">
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <IconSearch width={18} height={18} />
        <input placeholder="Chercher un nom, un email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>

      {!users && <p className="text-muted">Chargement…</p>}
      {users?.length > 0 && (
        <div className="stack--sm">
          {users.map((u) => (
            <div key={u._id} className="card card--tight row row--between">
              <div>
                <strong style={{ fontSize: 14 }}>{u.businessName}</strong>
                <div className="text-muted" style={{ fontSize: 12 }}>{u.email} · {u.phone}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="pill" style={{ fontSize: 10.5, textTransform: "capitalize" }}>{u.accountType}</span>
                {u.accountType === "vendeur" && (
                  <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                    {VERIFICATION_LABEL[u.sellerVerification?.status]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
