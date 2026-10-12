"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft, FaSave, FaPaperPlane, FaLock } from "react-icons/fa";
import ArticlePartnershipCard from "@/components/partnership/ArticlePartnershipCard";
import FileCard from "@/components/articles/FileCard";
import FileUploader from "@/components/articles/FileUploader";

const STATUS_META = {
  draft: { label: "Brouillon", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  submitted: { label: "Soumis — en attente de validation", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  validated: { label: "Validé", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Refusé", pill: "bg-red-50 text-red-700 ring-red-200" },
};

/**
 * Serialize article.partnership for client consumption.
 * Converts ObjectId / Date to plain strings.
 */
function serializePartnership(partnership) {
  if (!partnership) {
    return {
      publicSpaceSubmissionStatus: "none",
      cjpSubmissionStatus: "none",
    };
  }
  return {
    publicSpaceSubmissionStatus:
      partnership.publicSpaceSubmissionStatus || "none",
    publicSpaceRefusalReason: partnership.publicSpaceRefusalReason || null,
    publicSpaceSubmittedAt: partnership.publicSpaceSubmittedAt
      ? new Date(partnership.publicSpaceSubmittedAt).toISOString()
      : null,

    cjpSubmissionStatus: partnership.cjpSubmissionStatus || "none",
    cjpRefusalReason: partnership.cjpRefusalReason || null,
    cjpArticle: partnership.cjpArticle
      ? partnership.cjpArticle.toString()
      : null,
    cjpSubmittedAt: partnership.cjpSubmittedAt
      ? new Date(partnership.cjpSubmittedAt).toISOString()
      : null,
  };
}

export default function ArticleDetailPage() {
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/articles/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement échoué");
      setArticle(data.article);
      setForm(data.article);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const isDraft = article?.status === "draft";

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          abstract: form.abstract,
          introduction: form.introduction,
          methods: form.methods,
          results: form.results,
          discussion: form.discussion,
          ingredient: form.ingredient,
          description: form.description,
          advantages: form.advantages,
          sideEffects: form.sideEffects,
          region: form.region,
          usage: form.usage,
          precautions: form.precautions,
          tags: Array.isArray(form.tags)
            ? form.tags
            : (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitForValidation = async () => {
    if (!confirm("Soumettre cet article pour validation ? Vous ne pourrez plus le modifier.")) return;
    setSaving(true);
    try {
      await save();
      const res = await fetch(`/api/articles/${id}/submit`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-12 text-center text-gray-500">Chargement…</p>;
  if (error) return <p className="p-12 text-center text-red-600">{error}</p>;
  if (!article) return null;

  const meta = STATUS_META[article.status] || STATUS_META.draft;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/adminSOCAphy/articles"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Mes articles
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${meta.pill}`}>
            {meta.label}
          </span>
          {!isDraft && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <FaLock /> Verrouillé
            </span>
          )}
        </div>
        {article.rejectionReason && article.status === "rejected" && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong>Motif du refus :</strong> {article.rejectionReason}
          </div>
        )}
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Field label="Titre" name="title" value={form.title || ""} onChange={onChange} disabled={!isDraft} />

        {article.kind === "scientific" ? (
          <>
            <Field label="Résumé" name="abstract" value={form.abstract || ""} onChange={onChange} textarea rows={4} disabled={!isDraft} />
            <Field label="Introduction" name="introduction" value={form.introduction || ""} onChange={onChange} textarea rows={3} disabled={!isDraft} />
            <Field label="Méthodes" name="methods" value={form.methods || ""} onChange={onChange} textarea rows={3} disabled={!isDraft} />
            <Field label="Résultats" name="results" value={form.results || ""} onChange={onChange} textarea rows={3} disabled={!isDraft} />
            <Field label="Discussion" name="discussion" value={form.discussion || ""} onChange={onChange} textarea rows={3} disabled={!isDraft} />
          </>
        ) : (
          <>
            <Field label="Ingrédient" name="ingredient" value={form.ingredient || ""} onChange={onChange} disabled={!isDraft} />
            <Field label="Description" name="description" value={form.description || ""} onChange={onChange} textarea rows={3} disabled={!isDraft} />
            <Field label="Avantages" name="advantages" value={form.advantages || ""} onChange={onChange} textarea rows={2} disabled={!isDraft} />
            <Field label="Effets secondaires" name="sideEffects" value={form.sideEffects || ""} onChange={onChange} textarea rows={2} disabled={!isDraft} />
            <Field label="Région" name="region" value={form.region || ""} onChange={onChange} disabled={!isDraft} />
            <Field label="Usage" name="usage" value={form.usage || ""} onChange={onChange} textarea rows={2} disabled={!isDraft} />
            <Field label="Précautions" name="precautions" value={form.precautions || ""} onChange={onChange} textarea rows={2} disabled={!isDraft} />
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Pièces jointes ({article.attachments?.length || 0})
        </h2>

        {article.attachments?.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {article.attachments.map((a, i) => (
              <FileCard
                key={i}
                file={a}
                index={i}
                articleId={id}
                editable={isDraft}
                onChange={load}
              />
            ))}
          </div>
        )}

        {isDraft && (
          <FileUploader
            onUploaded={async (att) => {
              await fetch(`/api/articles/${id}/attachments-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ attachments: [att] }),
              });
              load();
            }}
          />
        )}
      </div>

      {/* Actions brouillon */}
      {isDraft && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <FaSave /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={submitForValidation}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <FaPaperPlane /> {saving ? "Envoi…" : "Soumettre pour validation"}
          </button>
        </div>
      )}

      {/* Partenariat : Espace public + CJP */}
      {!isDraft && (
        <div className="mt-8">
          <ArticlePartnershipCard
            article={{
              _id: article._id.toString(),
              title: article.title,
              status: article.status,
              profileType: article.profileType,
              partnership: serializePartnership(article.partnership),
            }}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, textarea, rows = 2, ...props }) {
  const className = `w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 ${
    props.disabled
      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
      : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500/20"
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
    </div>
  );
}
