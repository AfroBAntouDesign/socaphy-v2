// src/components/cjp/ReportButton.jsx
"use client";

import { useState } from "react";
import { FaFlag, FaTimes, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { REPORT_REASONS } from "@/lib/cjp";

export default function ReportButton({ articleId, enabled }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("plagiarism");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!enabled) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cjp/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ articleId, reason, details: details.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setDetails("");
        setReason("plagiarism");
      }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        title="Signaler un problème"
      >
        <FaFlag /> Signaler
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Signaler cet article
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Votre signalement sera examiné par un administrateur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <FaTimes />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-6 text-center">
                <FaCheckCircle className="text-4xl text-emerald-600" />
                <p className="mt-3 font-medium text-gray-900">
                  Signalement envoyé
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Merci — nous examinerons votre signalement rapidement.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Motif
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Détails (optionnel)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Précisez votre signalement…"
                    className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => !busy && setOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy && <FaSpinner className="animate-spin" />}
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
