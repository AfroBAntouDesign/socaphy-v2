// src/components/cv/CvSubmitForm.jsx
"use client";

import { useRef, useState } from "react";
import { FaUpload, FaSpinner, FaTimes, FaFileAlt } from "react-icons/fa";

const MAX_MB = 10;
const ACCEPTED = ".pdf,.doc,.docx,.odt";

export default function CvSubmitForm({ onSubmitted }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    heading: "",
    fullName: "",
    profession: "",
    summary: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Upload the file to /api/uploads ─────────────────────────── */

  const uploadFile = async (file) => {
    if (!file) return;
    setGlobalError("");
    if (file.size > MAX_MB * 1024 * 1024) {
      setGlobalError(`Fichier trop volumineux (max ${MAX_MB} Mo)`);
      return;
    }
    setUploading(true);
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
      setAttachment(data.attachment);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Submit the CV ───────────────────────────────────────────── */

  const validate = () => {
    const e = {};
    if (form.heading.trim().length < 3) e.heading = "Titre trop court";
    if (form.fullName.trim().length < 2) e.fullName = "Nom complet requis";
    if (!attachment) e.file = "Le fichier CV est requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, attachment }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Soumission échouée");
      }
      onSubmitted?.();
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
        label="Titre du CV"
        name="heading"
        value={form.heading}
        onChange={onChange}
        error={errors.heading}
        placeholder="Ex : CV — Chercheur en phytothérapie"
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Nom complet"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          error={errors.fullName}
          placeholder="Ex : Dr. Ngoupayo Jean"
          required
        />
        <Field
          label="Profession"
          name="profession"
          value={form.profession}
          onChange={onChange}
          error={errors.profession}
          placeholder="Ex : Médecin, Botaniste…"
        />
      </div>

      <Field
        label="Résumé du parcours"
        name="summary"
        value={form.summary}
        onChange={onChange}
        error={errors.summary}
        textarea
        rows={4}
        placeholder="Diplômes, expériences, publications, motivations…"
      />

      {/* File picker */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Fichier CV <span className="text-red-500">*</span>
        </label>

        {attachment ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FaFileAlt className="shrink-0 text-emerald-700" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-emerald-900">
                  {attachment.originalName}
                </p>
                <p className="text-xs text-emerald-700">
                  {attachment.type.toUpperCase()} ·{" "}
                  {(attachment.size / 1024).toFixed(0)} Ko
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="rounded p-2 text-red-600 hover:bg-red-100"
              aria-label="Retirer"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm font-medium text-gray-700 transition hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin text-emerald-600" />
                Envoi…
              </>
            ) : (
              <>
                <FaUpload className="text-emerald-600" />
                Choisir un fichier (PDF, Word, ODT) — max {MAX_MB} Mo
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          hidden
          onChange={(e) => uploadFile(e.target.files?.[0])}
        />

        {errors.file && (
          <p className="mt-1.5 text-xs text-red-600">{errors.file}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? "Envoi…" : "Soumettre le CV pour validation"}
      </button>
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