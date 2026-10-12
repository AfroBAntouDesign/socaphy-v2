// src/components/community/CommunityForm.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";

const CATEGORIES = [
  { value: "treatment", label: "Traitement d'une maladie" },
  { value: "practice", label: "Pratique traditionnelle" },
  { value: "product", label: "Produits naturels" },
  { value: "academic", label: "Recherche scientifique" },
  { value: "other", label: "Autre" },
];

export default function CommunityForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    theme: "",
    rules: "",
    category: "practice",
    isPublic: true,
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Nom trop court (min 3)";
    if (form.description.trim().length < 10) e.description = "Description trop courte (min 10)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Création échouée");
      }

      router.push(`/users/communaute/${data.community._id}`);
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
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <Field
        label="Nom de la communauté"
        name="name"
        value={form.name}
        onChange={onChange}
        error={errors.name}
        placeholder="Ex : Phytothérapie du paludisme"
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
        placeholder="En quelques phrases, présentez le sujet et l'objectif de la communauté."
        maxLength={500}
        required
      />

      <Field
        label="Thème principal"
        name="theme"
        value={form.theme}
        onChange={onChange}
        error={errors.theme}
        placeholder="Ex : Plantes antipaludiques du Cameroun"
      />

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
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Règles internes (optionnel)"
        name="rules"
        value={form.rules}
        onChange={onChange}
        textarea
        rows={5}
        placeholder="Règles de conduite, sujets autorisés, ce qui n'est pas toléré…"
        maxLength={3000}
      />

      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <input
          id="isPublic"
          name="isPublic"
          type="checkbox"
          checked={form.isPublic}
          onChange={onChange}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="isPublic" className="cursor-pointer">
          <p className="text-sm font-medium text-gray-900">
            Communauté publique
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Visible par tout le monde une fois validée. Décochez pour une
            communauté privée visible uniquement des membres.
          </p>
        </label>
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        ⚠️ La communauté sera examinée par un administrateur SOCAphy avant
        d'être publiée.
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving && <FaSpinner className="animate-spin" />}
          {saving ? "Création…" : "Créer la communauté"}
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