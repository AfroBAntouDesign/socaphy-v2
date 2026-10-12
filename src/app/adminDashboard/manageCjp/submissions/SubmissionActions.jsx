// src/app/adminDashboard/manageCjp/submissions/SubmissionActions.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FaCheck, FaTimes, FaBook, FaSpinner, FaEye, FaUndo, FaLayerGroup,
} from "react-icons/fa";
import {
  acceptArticle, rejectArticle, publishArticle, withdrawArticle,
  assignArticleToIssue,
} from "../actions";

export default function SubmissionActions({ article, issues }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // null | "reject" | "publish" | "assign"
  const [reason, setReason] = useState("");
  const [issueId, setIssueId] = useState(issues[0]?._id || "");
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

  const st = article.status;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {st === "submitted" && (
          <>
            <button
              onClick={() => run(acceptArticle, article._id)}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Accepter
            </button>
            <button
              onClick={() => setMode(mode === "reject" ? null : "reject")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <FaTimes /> Refuser
            </button>
          </>
        )}

        {st === "accepted" && (
          <>
            <button
              onClick={() => setMode(mode === "publish" ? null : "publish")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <FaBook /> Publier
            </button>
            <button
              onClick={() => setMode(mode === "reject" ? null : "reject")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <FaTimes /> Refuser
            </button>
          </>
        )}

        {st === "published" && (
          <>
            {article.issue ? (
              <Link
                href={`/cjp/articles/${article._id}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <FaEye /> Voir
              </Link>
            ) : (
              <button
                onClick={() => setMode(mode === "assign" ? null : "assign")}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
              >
                <FaLayerGroup /> Assigner un numéro
              </button>
            )}
            <button
              onClick={() => {
                if (!confirm("Retirer cet article de la publication ?")) return;
                run(withdrawArticle, article._id, "Retiré par l'administration");
              }}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <FaUndo /> Retirer
            </button>
          </>
        )}

        {st === "rejected" && (
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
            Article refusé
          </span>
        )}
      </div>

      {/* Reject panel */}
      {mode === "reject" && (
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Motif du refus (min 5 caractères)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex : méthodologie insuffisante, données non reproductibles…"
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setMode(null); setReason(""); }}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => run(rejectArticle, article._id, reason)}
              disabled={pending}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "..." : "Confirmer"}
            </button>
          </div>
        </div>
      )}

      {/* Publish panel */}
      {mode === "publish" && (
        <div className="w-full max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <label className="mb-1 block text-xs font-medium text-emerald-900">
            Assigner à un numéro (optionnel)
          </label>
          <select
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">— Ne pas assigner —</option>
            {issues.map((i) => (
              <option key={i._id} value={i._id}>
                Vol. {i.volume}, No. {i.number} ({i.year})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-emerald-800">
            L'article sera publié immédiatement.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setMode(null)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => run(publishArticle, article._id, issueId || null)}
              disabled={pending}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? "..." : "Publier"}
            </button>
          </div>
        </div>
      )}

      {/* Assign panel */}
      {mode === "assign" && (
        <div className="w-full max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <label className="mb-1 block text-xs font-medium text-emerald-900">
            Assigner à un numéro
          </label>
          <select
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {issues.map((i) => (
              <option key={i._id} value={i._id}>
                Vol. {i.volume}, No. {i.number} ({i.year})
              </option>
            ))}
          </select>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setMode(null)}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => run(assignArticleToIssue, article._id, issueId)}
              disabled={pending}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? "..." : "Assigner"}
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
    </div>
  );
}
