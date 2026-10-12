"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaPlus, FaTimes, FaSave, FaArrowLeft } from "react-icons/fa";
import FileUploader from "@/components/articles/FileUploader";

export default function NewArticlePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    kind: "scientific",
    abstract: "",
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    ingredient: "",
    description: "",
    advantages: "",
    sideEffects: "",
    region: "",
    usage: "",
    precautions: "",
    tags: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isScientific = form.kind === "scientific";

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 5) e.title = "Titre trop court (min 5)";
    if (isScientific && form.abstract.trim().length < 20)
      e.abstract = "Résumé trop court (min 20 caractères)";
    if (!isScientific && form.description.trim().length < 20)
      e.description = "Description trop courte (min 20 caractères)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (mode) => {
    setGlobalError("");
    if (mode === "submitted" && !validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        kind: form.kind,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ...(isScientific
          ? {
              abstract: form.abstract,
              introduction: form.introduction,
              methods: form.methods,
              results: form.results,
              discussion: form.discussion,
            }
          : {
              ingredient: form.ingredient,
              description: form.description,
              advantages: form.advantages,
              sideEffects: form.sideEffects,
              region: form.region,
              usage: form.usage,
              precautions: form.precautions,
            }),
      };

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Création échouée");
        if (data.details) setErrors(data.details);
        return;
      }

      const articleId = data.article._id;

      if (attachments.length > 0) {
        await fetch(`/api/articles/${articleId}/attachments-bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ attachments }),
        });
      }

      if (mode === "submitted") {
        await fetch(`/api/articles/${articleId}/submit`, {
          method: "POST",
          credentials: "include",
        });
      }

      router.push(`/users/adminSOCAphy/articles/${articleId}`);
      router.refresh();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/users/adminSOCAphy"
          className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <FaArrowLeft /> Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Nouvel article
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Rédigez votre article, joignez vos documents, puis enregistrez en brouillon ou soumettez pour validation.
        </p>
      </div>

      {globalError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="mb-6 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, kind: "scientific" }))}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            isScientific
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Article scientifique
        </button>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, kind: "practical" }))}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            !isScientific
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Pratique / Protocole
        </button>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Field
          label="Titre"
          name="title"
          value={form.title}
          onChange={onChange}
          error={errors.title}
          placeholder="Ex : Étude préliminaire sur le Vernonia amygdalina"
        />

        {isScientific ? (
          <>
            <Field label="Résumé (abstract)" name="abstract" value={form.abstract} onChange={onChange} error={errors.abstract} textarea rows={4} />
            <Field label="Introduction" name="introduction" value={form.introduction} onChange={onChange} textarea rows={3} />
            <Field label="Méthodes" name="methods" value={form.methods} onChange={onChange} textarea rows={3} />
            <Field label="Résultats" name="results" value={form.results} onChange={onChange} textarea rows={3} />
            <Field label="Discussion" name="discussion" value={form.discussion} onChange={onChange} textarea rows={3} />
          </>
        ) : (
          <>
            <Field label="Ingrédient / Plante" name="ingredient" value={form.ingredient} onChange={onChange} />
            <Field label="Description" name="description" value={form.description} onChange={onChange} error={errors.description} textarea rows={3} />
            <Field label="Avantages" name="advantages" value={form.advantages} onChange={onChange} textarea rows={2} />
            <Field label="Effets secondaires" name="sideEffects" value={form.sideEffects} onChange={onChange} textarea rows={2} />
            <Field label="Région d'origine" name="region" value={form.region} onChange={onChange} />
            <Field label="Usage" name="usage" value={form.usage} onChange={onChange} textarea rows={2} />
            <Field label="Précautions" name="precautions" value={form.precautions} onChange={onChange} textarea rows={2} />
          </>
        )}

        <Field
          label="Étiquettes (séparées par des virgules)"
          name="tags"
          value={form.tags}
          onChange={onChange}
          placeholder="paludisme, vernonia, antipaludique"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Pièces jointes
          </label>

          {attachments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {attachments.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {a.originalName || a.storedName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(a.size / 1024).toFixed(0)} Ko · {a.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded p-2 text-red-600 hover:bg-red-50"
                    aria-label="Retirer"
                  >
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FileUploader
            onUploaded={(att) => setAttachments((prev) => [...prev, att])}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => submit("draft")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <FaSave /> {saving ? "Enregistrement…" : "Enregistrer comme brouillon"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => submit("submitted")}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <FaPlus /> {saving ? "Envoi…" : "Soumettre pour validation"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, error, textarea, rows = 2, ...props }) {
  const className = `w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:bg-white ${
    error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/20"
  }`;

  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {textarea ? (
        <textarea id={props.name} rows={rows} {...props} className={`${className} resize-y`} />
      ) : (
        <input id={props.name} {...props} className={className} />
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}