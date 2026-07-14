import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { IconPlus, IconX } from "../components/icons.jsx";

const STATUS_LABEL = { disponible: "Disponible", rupture: "Rupture", archive: "Archivé" };

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

const EMPTY_FORM = { name: "", description: "", price: "", stock: "", photos: [] };

export default function Catalog() {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/products").then((d) => setProducts(d.products));

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      stock: p.stock === null || p.stock === undefined ? "" : String(p.stock),
      photos: p.photos || [],
    });
  };

  const uploadPhoto = async (file) => {
    setUploading(true);
    setError("");
    try {
      const { uploadUrl, publicUrl } = await api.post("/uploads", { contentType: file.type });
      const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Échec de l'envoi de la photo");
      setForm((f) => ({ ...f, photos: [...f.photos, publicUrl] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url) => {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== url) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Le nom est requis");
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return setError("Prix invalide");

    const payload = {
      name: form.name.trim(),
      description: form.description,
      price,
      stock: form.stock === "" ? null : Number(form.stock),
      photos: form.photos,
    };

    try {
      if (editingId) await api.patch(`/products/${editingId}`, payload);
      else await api.post("/products", payload);
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (id, status) => {
    await api.patch(`/products/${id}`, { status });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/products/${id}`);
    if (editingId === id) resetForm();
    load();
  };

  return (
    <div className="stack">
      <h1 className="display-2">Catalogue</h1>
      <p className="text-muted" style={{ fontSize: 13.5 }}>
        Tes produits, avec photos et prix — partage ta vitrine avec un lien, colle une fiche produit dans une conversation.
      </p>

      <form onSubmit={submit} className="card card--tight stack--sm">
        <div className="field">
          <label>Nom du produit</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Robe wax bleue" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Détails, tailles, matière…" />
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Prix (FCFA)</label>
            <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="15000" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Stock (vide = illimité)</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="10" />
          </div>
        </div>

        <div className="field">
          <label>Photos</label>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {form.photos.map((url) => (
              <div key={url} style={{ position: "relative" }}>
                <img src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1.5px solid var(--line)" }} />
                <button type="button" onClick={() => removePhoto(url)} className="btn btn--ghost btn--icon" style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22 }}>
                  <IconX width={12} height={12} />
                </button>
              </div>
            ))}
            <label className="btn btn--ghost btn--sm" style={{ cursor: "pointer" }}>
              {uploading ? "Envoi…" : "+ Ajouter"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--primary" type="submit">
            <IconPlus width={16} height={16} />
            {editingId ? "Enregistrer" : "Ajouter au catalogue"}
          </button>
          {editingId && (
            <button className="btn btn--ghost" type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {!products && <p className="text-muted">Chargement…</p>}
      {products?.length === 0 && (
        <div className="empty">
          <div className="h2">Aucun produit</div>
          <p>Ajoute ton premier produit pour commencer à construire ta vitrine.</p>
        </div>
      )}

      {products?.length > 0 && (
        <div className="row" style={{ flexWrap: "wrap", gap: 12 }}>
          {products.map((p) => (
            <div key={p._id} className="card card--tight" style={{ width: 220 }}>
              {p.photos?.[0] ? (
                <img src={p.photos[0]} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, marginBottom: 8 }} />
              ) : (
                <div className="skeleton" style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }} />
              )}
              <div className="row row--between">
                <strong style={{ fontSize: 14 }}>{p.name}</strong>
                <span className="pill" style={{ fontSize: 10.5 }}>{STATUS_LABEL[p.status]}</span>
              </div>
              <div className="mono" style={{ fontSize: 13, marginTop: 2 }}>{formatFcfa(p.price)}</div>
              <div className="text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                {p.stock === null || p.stock === undefined ? "Stock illimité" : `${p.stock} en stock`}
              </div>
              <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => startEdit(p)}>
                  Modifier
                </button>
                {p.status !== "archive" ? (
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => setStatus(p._id, "archive")}>
                    Archiver
                  </button>
                ) : (
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => setStatus(p._id, "disponible")}>
                    Republier
                  </button>
                )}
                <button className="btn btn--danger btn--sm" type="button" onClick={() => remove(p._id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
