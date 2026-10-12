// src/app/adminDashboard/manageCjp/info/InfoForm.jsx
"use client";

import { useState, useTransition } from "react";
import { FaSave, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { updateJournalInfo } from "../actions";

const TABS = [
  { key: "identity", label: "Identité" },
  { key: "descriptions", label: "Descriptions" },
  { key: "instructions", label: "Instructions" },
  { key: "contact", label: "Contact" },
  { key: "policies", label: "Politiques" },
];

export default function InfoForm({ initial }) {
  const [tab, setTab] = useState("identity");
  const [form, setForm] = useState({
    shortName: initial?.shortName || "CJP",
    name: initial?.name || "",
    tagline: initial?.tagline || "",
    issn: initial?.issn || "",
    eissn: initial?.eissn || "",
    frequency: initial?.frequency || "",
    publisher: initial?.publisher || "",
    foundedYear: initial?.foundedYear || "",

    descriptionFR: initial?.descriptionFR || "",
    descriptionEN: initial?.descriptionEN || "",
    scopeFR: initial?.scopeFR || "",
    scopeEN: initial?.scopeEN || "",
    ethicsFR: initial?.ethicsFR || "",
    ethicsEN: initial?.ethicsEN || "",

    instructionsFR: initial?.instructionsFR || "",
    instructionsEN: initial?.instructionsEN || "",

    contactEmail: initial?.contactEmail || "",
    contactPhone: initial?.contactPhone || "",
    contactAddress: initial?.contactAddress || "",
    contactCity: initial?.contactCity || "",
    contactCountry: initial?.contactCountry || "",

    openAccess: initial?.openAccess ?? true,
    peerReviewed: initial?.peerReviewed ?? true,
    apc: initial?.apc || "",
    website: initial?.website || "",
    twitter: initial?.twitter || "",
    linkedin: initial?.linkedin || "",
  });

  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const save = () => {
    startTransition(async () => {
      try {
        const res = await updateJournalInfo(form);
        setToast({ type: "success", text: res.message });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" && <FaCheckCircle />}
          {toast.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {tab === "identity" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Sigle" name="shortName" value={form.shortName} onChange={onChange} />
              <Field label="Nom complet" name="name" value={form.name} onChange={onChange} />
            </div>
            <Field label="Sous-titre / Tagline" name="tagline" value={form.tagline} onChange={onChange} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ISSN" name="issn" value={form.issn} onChange={onChange} placeholder="XXXX-XXXX" />
              <Field label="e-ISSN (optionnel)" name="eissn" value={form.eissn} onChange={onChange} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fréquence de publication" name="frequency" value={form.frequency} onChange={onChange} />
              <Field label="Année de fondation" name="foundedYear" value={form.foundedYear} onChange={onChange} type="number" />
            </div>
            <Field label="Éditeur" name="publisher" value={form.publisher} onChange={onChange} />
          </div>
        )}

        {tab === "descriptions" && (
          <div className="space-y-4">
            <Field label="Description (FR)" name="descriptionFR" value={form.descriptionFR} onChange={onChange} textarea rows={5} />
            <Field label="Description (EN)" name="descriptionEN" value={form.descriptionEN} onChange={onChange} textarea rows={5} />
            <Field label="Domaines / Scope (FR)" name="scopeFR" value={form.scopeFR} onChange={onChange} textarea rows={6} />
            <Field label="Scope (EN)" name="scopeEN" value={form.scopeEN} onChange={onChange} textarea rows={6} />
          </div>
        )}

        {tab === "instructions" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Utilisez des sauts de ligne pour structurer le texte. Le rendu
              conservera les retours à la ligne.
            </div>
            <Field label="Instructions aux auteurs (FR)" name="instructionsFR" value={form.instructionsFR} onChange={onChange} textarea rows={14} />
            <Field label="Instructions for authors (EN)" name="instructionsEN" value={form.instructionsEN} onChange={onChange} textarea rows={14} />
            <Field label="Éthique et politiques (FR)" name="ethicsFR" value={form.ethicsFR} onChange={onChange} textarea rows={6} />
            <Field label="Ethics and policies (EN)" name="ethicsEN" value={form.ethicsEN} onChange={onChange} textarea rows={6} />
          </div>
        )}

        {tab === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email" name="contactEmail" value={form.contactEmail} onChange={onChange} type="email" />
              <Field label="Téléphone" name="contactPhone" value={form.contactPhone} onChange={onChange} />
            </div>
            <Field label="Adresse" name="contactAddress" value={form.contactAddress} onChange={onChange} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ville" name="contactCity" value={form.contactCity} onChange={onChange} />
              <Field label="Pays" name="contactCountry" value={form.contactCountry} onChange={onChange} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Site web" name="website" value={form.website} onChange={onChange} />
              <Field label="Twitter / X" name="twitter" value={form.twitter} onChange={onChange} />
              <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={onChange} />
            </div>
          </div>
        )}

        {tab === "policies" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="openAccess"
                  checked={form.openAccess}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Accès libre (Open Access)
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="peerReviewed"
                  checked={form.peerReviewed}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Évaluation par les pairs (Peer-reviewed)
                </span>
              </label>
            </div>
            <Field
              label="Frais de publication (APC)"
              name="apc"
              value={form.apc}
              onChange={onChange}
              placeholder="Ex : Gratuit / 50 000 FCFA"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, textarea, rows = 3, ...props }) {
  const cls = `w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20`;
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {textarea ? (
        <textarea id={props.name} rows={rows} {...props} className={`${cls} resize-y font-mono`} />
      ) : (
        <input id={props.name} {...props} className={cls} />
      )}
    </div>
  );
}
