// src/components/cjp/ArticleForm.jsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  FaSpinner, FaPlus, FaTrash, FaSave, FaPaperPlane,
  FaCheckCircle, FaTimes, FaExclamationTriangle,
} from "react-icons/fa";
import { ARTICLE_SECTIONS } from "@/lib/cjp";

export default function ArticleForm() {
  const router = useRouter();
  const errorRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    titleFR: "",
    titleEN: "",
    section: "original_research",
    language: "fr",
    abstractFR: "",
    abstractEN: "",
    keywordsFR: "",
    keywordsEN: "",
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    conclusion: "",
    acknowledgments: "",
    funding: "",
    conflictsOfInterest: "",
    dataAvailability: "",
  });

  const [authors, setAuthors] = useState([
    { name: "", title: "", affiliation: "", email: "", isCorresponding: true },
  ]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null); // { mode, cjpId, articleId }

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onAuthorChange = (i, key, value) => {
    setAuthors((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [key]: value } : a))
    );
  };

  const addAuthor = () =>
    setAuthors((prev) => [
      ...prev,
      { name: "", title: "", affiliation: "", email: "", isCorresponding: false },
    ]);

  const removeAuthor = (i) =>
    setAuthors((prev) => prev.filter((_, idx) => idx !== i));

  const showError = (msg) => {
    setError(msg);
    // Scroll to error banner
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const submit = async (mode) => {
    console.log(`[CJP submit] Démarrage — mode=${mode}`);
    setError("");
    setSaving(true);

    try {
      // ── Client-side validation ─────────────────────────────
      if (mode === "submitted") {
        if (form.title.trim().length < 10) {
          setSaving(false);
          return showError("❌ Titre trop court — minimum 10 caractères pour soumettre");
        }
        if (!authors[0]?.name?.trim()) {
          setSaving(false);
          return showError("❌ Au moins un auteur avec nom est requis");
        }
        if (!form.abstractFR.trim() && !form.abstractEN.trim()) {
          setSaving(false);
          return showError("❌ Un résumé (FR ou EN) est requis pour soumettre");
        }
      } else {
        if (!form.title.trim()) {
          setSaving(false);
          return showError("❌ Donnez au moins un titre à votre brouillon");
        }
      }

      // ── Build payload ──────────────────────────────────────
      const payload = {
        title: form.title.trim(),
        titleFR: form.titleFR.trim(),
        titleEN: form.titleEN.trim(),
        section: form.section,
        language: form.language,
        abstractFR: form.abstractFR.trim(),
        abstractEN: form.abstractEN.trim(),
        keywordsFR: form.keywordsFR.split(",").map((k) => k.trim()).filter(Boolean),
        keywordsEN: form.keywordsEN.split(",").map((k) => k.trim()).filter(Boolean),
        authors: authors
          .filter((a) => a.name.trim())
          .map((a, i) => ({ ...a, name: a.name.trim(), order: i })),
        introduction: form.introduction,
        methods: form.methods,
        results: form.results,
        discussion: form.discussion,
        conclusion: form.conclusion,
        acknowledgments: form.acknowledgments,
        funding: form.funding,
        conflictsOfInterest: form.conflictsOfInterest,
        dataAvailability: form.dataAvailability,
      };

      // ── Step 1: create draft ───────────────────────────────
      console.log("[CJP submit] → POST /api/cjp/articles");
      const res = await fetch("/api/cjp/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log(`[CJP submit] ← ${res.status}`, data);

      if (!res.ok) {
        if (data.details && typeof data.details === "object") {
          const field = Object.keys(data.details)[0];
          const msg = Array.isArray(data.details[field])
            ? data.details[field][0]
            : data.details[field];
          throw new Error(`Champ "${field}" : ${msg}`);
        }
        throw new Error(data.error || `Échec de la création (${res.status})`);
      }

      const articleId = data.article._id;
      const cjpId = data.article.cjpId;

      // ── Step 2: submit if requested ────────────────────────
      if (mode === "submitted") {
        console.log(`[CJP submit] → POST /api/cjp/articles/${articleId}/submit`);
        const sub = await fetch(`/api/cjp/articles/${articleId}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const subData = await sub.json();
        console.log(`[CJP submit] ← ${sub.status}`, subData);

        if (!sub.ok) {
          throw new Error(
            `Article sauvegardé en brouillon, mais la soumission a échoué : ${subData.error || sub.status}. Vous pouvez réessayer depuis "Mes soumissions".`
          );
        }
      }

      // ── Success ────────────────────────────────────────────
      setSaving(false);
      setSuccess({ mode, cjpId, articleId });
    } catch (err) {
      console.error("[CJP submit] ERREUR :", err);
      setSaving(false);
      showError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner (scroll target) */}
      {error && (
        <div
          ref={errorRef}
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <FaExclamationTriangle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Classification */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
          1. Classification
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Type d'article *
            </label>
            <select
              name="section"
              value={form.section}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {ARTICLE_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.labelEN}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Langue principale
            </label>
            <select
              name="language"
              value={form.language}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="bilingual">Bilingue FR + EN</option>
            </select>
          </div>
        </div>
      </section>

      {/* Title */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
          2. Titre
        </h2>
        <Field
          label="Titre principal *"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Ex : Activité antipaludique de Vernonia amygdalina chez le rat"
          maxLength={300}
          required
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titre (FR)" name="titleFR" value={form.titleFR} onChange={onChange} maxLength={300} />
          <Field label="Title (EN)" name="titleEN" value={form.titleEN} onChange={onChange} maxLength={300} />
        </div>
      </section>

      {/* Authors */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-gray-900">
            3. Auteurs
          </h2>
          <button
            type="button"
            onClick={addAuthor}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaPlus /> Ajouter
          </button>
        </div>

        <div className="space-y-4">
          {authors.map((a, i) => (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Auteur {i + 1} {i === 0 && <span className="text-red-500">*</span>}
                </span>
                {authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(i)}
                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Retirer"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  placeholder="Nom complet *"
                  value={a.name}
                  onChange={(e) => onAuthorChange(i, "name", e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  placeholder="Titre (Prof., Dr., PhD)"
                  value={a.title}
                  onChange={(e) => onAuthorChange(i, "title", e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <input
                  placeholder="Affiliation"
                  value={a.affiliation}
                  onChange={(e) => onAuthorChange(i, "affiliation", e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={a.email}
                  onChange={(e) => onAuthorChange(i, "email", e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={a.isCorresponding}
                    onChange={(e) => onAuthorChange(i, "isCorresponding", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Auteur correspondant
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Abstracts */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
          4. Résumés
        </h2>
        <Field
          label="Résumé (FR)"
          name="abstractFR"
          value={form.abstractFR}
          onChange={onChange}
          textarea
          rows={5}
          maxLength={3000}
        />
        <Field
          label="Mots-clés FR (séparés par des virgules)"
          name="keywordsFR"
          value={form.keywordsFR}
          onChange={onChange}
          placeholder="paludisme, vernonia, antipaludique"
        />
        <div className="mt-4">
          <Field
            label="Abstract (EN)"
            name="abstractEN"
            value={form.abstractEN}
            onChange={onChange}
            textarea
            rows={5}
            maxLength={3000}
          />
          <Field
            label="Keywords EN (comma separated)"
            name="keywordsEN"
            value={form.keywordsEN}
            onChange={onChange}
            placeholder="malaria, vernonia, antimalarial"
          />
        </div>
      </section>

      {/* Body */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
          5. Corps de l'article
        </h2>
        <div className="space-y-4">
          <Field label="Introduction" name="introduction" value={form.introduction} onChange={onChange} textarea rows={4} />
          <Field label="Méthodes / Matériel et méthodes" name="methods" value={form.methods} onChange={onChange} textarea rows={4} />
          <Field label="Résultats" name="results" value={form.results} onChange={onChange} textarea rows={4} />
          <Field label="Discussion" name="discussion" value={form.discussion} onChange={onChange} textarea rows={4} />
          <Field label="Conclusion" name="conclusion" value={form.conclusion} onChange={onChange} textarea rows={3} />
        </div>
      </section>

      {/* Declarations */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
          6. Déclarations
        </h2>
        <div className="space-y-4">
          <Field label="Financement" name="funding" value={form.funding} onChange={onChange} textarea rows={2} />
          <Field label="Conflits d'intérêts" name="conflictsOfInterest" value={form.conflictsOfInterest} onChange={onChange} textarea rows={2} />
          <Field label="Remerciements" name="acknowledgments" value={form.acknowledgments} onChange={onChange} textarea rows={2} />
          <Field label="Disponibilité des données" name="dataAvailability" value={form.dataAvailability} onChange={onChange} textarea rows={2} />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-600">
          ⚠️ Le fichier PDF du manuscrit pourra être ajouté après création du
          brouillon, depuis votre espace personnel.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => submit("draft")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Enregistrer comme brouillon
          </button>
          <button
            type="button"
            onClick={() => submit("submitted")}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            {saving ? "Envoi en cours…" : "Soumettre pour évaluation"}
          </button>
        </div>
      </div>

      {/* Success modal */}
      {success && (
        <SuccessModal
          mode={success.mode}
          cjpId={success.cjpId}
          articleId={success.articleId}
          onClose={() => {
            setSuccess(null);
            router.push(`/cjp/submit/success?id=${success.articleId}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

function SuccessModal({ mode, cjpId, articleId, onClose }) {
  const isSubmitted = mode === "submitted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <FaCheckCircle className="text-3xl" />
        </div>

        <h2 className="font-serif text-xl font-bold text-gray-900">
          {isSubmitted ? "Article soumis !" : "Brouillon enregistré"}
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          {isSubmitted
            ? "Votre article a bien été soumis pour évaluation par le comité scientifique du CJP."
            : "Votre article a été sauvegardé comme brouillon. Vous pouvez le soumettre plus tard."}
        </p>

        {cjpId && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Identifiant CJP
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-900">
              {cjpId}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

function Field({ label, textarea, rows = 3, ...props }) {
  const cls =
    "w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
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
    </div>
  );
}
