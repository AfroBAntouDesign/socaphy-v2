// src/components/marketplace/ShopForm.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSpinner, FaStore } from "react-icons/fa";

export default function ShopForm({ initial = null, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    address: initial?.address || "",
    city: initial?.city || "",
    region: initial?.region || "",
    openingHours: initial?.openingHours || "",
    licenseNumber: initial?.licenseNumber || "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Nom trop court";
    if (form.description.trim().length < 20)
      e.description = "Description trop courte (min 20)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setSaving(true);
    try {
      const url = mode === "create" ? "/api/shops" : `/api/shops/${initial._id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Échec");
      }

      if (mode === "create") {
        router.push("/users/boutique");
      } else {
        router.refresh();
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <Field
        label="Nom de la boutique"
        name="name"
        value={form.name}
        onChange={onChange}
        error={errors.name}
        placeholder="Ex : Herboristerie Ngoupayo"
        required
      />

      <Field
        label="Description"
        name="description"
        value={form.description}
        onChange={onChange}
        error={errors.description}
        textarea
        rows={3}
        placeholder="Présentez votre activité, vos produits, votre expertise…"
        maxLength={1000}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Téléphone" name="phone" value={form.phone} onChange={onChange} placeholder="+237 6 XX XX XX XX" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} />
      </div>

      <Field label="Adresse" name="address" value={form.address} onChange={onChange} placeholder="Quartier, rue…" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ville" name="city" value={form.city} onChange={onChange} />
        <Field label="Région" name="region" value={form.region} onChange={onChange} />
      </div>

      <Field
        label="Horaires d'ouverture"
        name="openingHours"
        value={form.openingHours}
        onChange={onChange}
        placeholder="Lun-Ven 8h-18h, Sam 9h-13h"
      />

      <Field
        label="Numéro de licence / autorisation"
        name="licenseNumber"
        value={form.licenseNumber}
        onChange={onChange}
        placeholder="Ex : AUT-2026-XXXX"
      />

      {mode === "create" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          ⚠️ Votre boutique sera examinée par un administrateur SOCAphy avant
          d'être visible publiquement.
        </div>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaStore />}
          {saving
            ? "Enregistrement…"
            : mode === "create"
            ? "Créer la boutique"
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