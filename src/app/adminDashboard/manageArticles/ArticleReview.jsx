// src/app/adminDashboard/manageArticles/ArticleReview.jsx
"use client";

import { useState, useTransition } from "react";
import {
  FaEye, FaCheck, FaTimes, FaSpinner, FaFileAlt, FaDownload,
} from "react-icons/fa";
import { validateArticle, rejectArticle } from "./actions";

export default function ArticleReview({ article }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // null | "view" | "reject"
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  const run = (fn, ...args) => {
    startTransition(async () => {
      try {
        const res = await fn(...args);
        setToast({ type: "success", text: res.message });
        setMode(null);
        setReason("");
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  const canReview = article.status === "submitted";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setMode("view")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <FaEye /> Voir
        </button>

        {canReview && (
          <>
            <button
              onClick={() => run(validateArticle, article._id)}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Valider
            </button>

            <button
              onClick={() => setMode(mode === "reject" ? null : "reject")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <FaTimes /> Refuser
            </button>
          </>
        )}
      </div>

      {/* Reject reason input */}
      {mode === "reject" && (
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Motif du refus (obligatoire, min 5 caractères)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex : méthodologie insuffisante, références manquantes, plante non identifiée…"
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setMode(null);
                setReason("");
              }}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => run(rejectArticle, article._id, reason)}
              disabled={pending}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "..." : "Confirmer le refus"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`rounded-md px-3 py-1.5 text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {mode === "view" && (
        <ViewModal article={article} onClose={() => setMode(null)} />
      )}
    </div>
  );
}

/* ── View modal ──────────────────────────────────────────────────── */

function ViewModal({ article, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-900">
              {article.title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {article.kind === "scientific" ? "Article scientifique" : "Pratique / Protocole"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Summary */}
          {(article.abstract || article.description) && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {article.abstract ? "Résumé" : "Description"}
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {article.abstract || article.description}
              </p>
            </div>
          )}

          {/* Attachments */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pièces jointes ({article.attachments?.length || 0})
            </h3>

            {article.attachments?.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune pièce jointe.</p>
            ) : (
              <ul className="space-y-2">
                {article.attachments.map((att, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FaFileAlt className="shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {att.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {att.type} · {(att.size / 1024).toFixed(0)} Ko
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-200"
                        title="Ouvrir"
                      >
                        <FaEye />
                      </a>
                      <a
                        href={att.fileUrl}
                        download={att.originalName}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-200"
                        title="Télécharger"
                      >
                        <FaDownload />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}