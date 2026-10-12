// src/components/marketplace/ProductForm.jsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FaSpinner, FaPlus, FaTimes, FaImage, FaBoxOpen,
} from "react-icons/fa";
import { PRODUCT_CATEGORIES } from "@/lib/marketplace";

export default function ProductForm({ initial = null, mode = "create" }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    category: initial?.category || "plants",
    price: initial?.price ?? "",
    unit: initial?.unit || "",
    stock: initial?.stock ?? 0,
    ingredients: initial?.ingredients || "",
    usage: initial?.usage || "",
    precautions: initial?.precautions || "",
    sideEffects: initial?.sideEffects || "",
  });
  const [images, setImages] = useState(initial?.images || []);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const uploadImage = async (file) => {
    if (!file) return;
    if (images.length >= 5) {
      setGlobalError("Maximum 5 images.");
      return;
    }
    setUploading(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      setImages((prev) => [...prev, data.attachment.fileUrl]);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Nom trop court";
    if (form.description.trim().length < 20)
      e.description = "Description trop courte (min 20)";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) e.price = "Prix invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        images,
      };

      const url = mode === "create" ? "/api/products" : `/api/products/${initial._id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Échec");
      }

      router.push("/users/boutique/produits");
      router.refresh();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <Field
        label="Nom du produit"
        name="name"
        value={form.name}
        onChange={onChange}
        error={errors.name}
        placeholder="Ex : Poudre d'écorce de Vernonia"
        required
      />

      <Field
        label="Description"
        name="description"
        value={form.description}
        onChange={onChange}
        error={errors.description}
        textarea
        rows={4}
        placeholder="Décrivez le produit, ses bienfaits, son origine…"
        maxLength={3000}
        required
      />

      {/* Category + Unit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-gray-700">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Unité / Conditionnement"
          name="unit"
          value={form.unit}
          onChange={onChange}
          placeholder="100g, 250ml, boîte de 60 gélules…"
        />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Prix (XAF)"
          name="price"
          type="number"
          min="0"
          step="1"
          value={form.price}
          onChange={onChange}
          error={errors.price}
          placeholder="Ex : 5000"
          required
        />
        <Field
          label="Stock disponible"
          name="stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={onChange}
          error={errors.stock}
        />
      </div>

      {/* Images */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Images (max 5)
        </label>

        {images.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 rounded-md bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Retirer"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin text-emerald-600" />
                Envoi…
              </>
            ) : (
              <>
                <FaImage className="text-emerald-600" />
                Ajouter une image
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => uploadImage(e.target.files?.[0])}
        />
      </div>

      <Field
        label="Ingrédients"
        name="ingredients"
        value={form.ingredients}
        onChange={onChange}
        textarea
        rows={2}
        maxLength={1000}
      />

      <Field
        label="Mode d'emploi"
        name="usage"
        value={form.usage}
        onChange={onChange}
        textarea
        rows={2}
        maxLength={1000}
      />

      <Field
        label="Précautions"
        name="precautions"
        value={form.precautions}
        onChange={onChange}
        textarea
        rows={2}
        maxLength={1000}
      />

      <Field
        label="Effets secondaires possibles"
        name="sideEffects"
        value={form.sideEffects}
        onChange={onChange}
        textarea
        rows={2}
        maxLength={1000}
      />

      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        ⚠️ Le produit sera examiné par un administrateur SOCAphy avant d'être
        mis en vente sur le marché.
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-5">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaBoxOpen />}
          {saving
            ? "Enregistrement…"
            : mode === "create"
            ? "Créer le produit"
            : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, textarea, rows = 3, ...props }) {
  const cls = `w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/20"
  }`;
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea id={props.name} rows={rows} {...props} className={`${cls} resize-y`} />
      ) : (
        <input id={props.name} {...props} className={cls} />
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}