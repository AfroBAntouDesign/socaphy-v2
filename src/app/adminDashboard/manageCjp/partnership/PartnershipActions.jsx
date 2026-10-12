// src/app/adminDashboard/manageCjp/partnership/PartnershipActions.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FaCheck, FaTimes, FaSpinner, FaExternalLinkAlt, FaGlobe, FaUndo,
} from "react-icons/fa";
import {
  approvePublicSpaceSubmission,
  refusePublicSpaceSubmission,
  approveCjpSubmission,
  refuseCjpSubmission,
  featureCjpInPublicSpace,
  unfeatureCjpFromPublicSpace,
} from "./actions";

/* ═══════════════════════════════════════════════════════════════ */
/*  Reusable pieces                                               */
/* ═══════════════════════════════════════════════════════════════ */

function RejectPanel({ label, onSubmit, onCancel, pending }) {
  const [reason, setReason] = useState("");
  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
      <label className="mb-1 block text-xs font-medium text-gray-700">
        {label} (min 5 caractères)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          onClick={() => onSubmit(reason)}
          disabled={pending}
          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "..." : "Confirmer"}
        </button>
      </div>
    </div>
  );
}

function useSimpleAction() {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null);
  const [toast, setToast] = useState(null);

  const run = (fn, ...args) => {
    startTransition(async () => {
      try {
        const res = await fn(...args);
        setToast({ type: "success", text: res.message });
        setMode(null);
        setTimeout(() => setToast(null), 4000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 5000);
      }
    });
  };

  return { pending, mode, setMode, toast, run };
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`rounded-md px-3 py-1.5 text-xs ${
        toast.type === "success"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-700"
      }`}
    >
      {toast.text}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Public space submission review                                */
/* ═══════════════════════════════════════════════════════════════ */

export function PublicSpaceSubmissionReview({ article }) {
  const { pending, mode, setMode, toast, run } = useSimpleAction();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => run(approvePublicSpaceSubmission, article._id)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          Publier
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "refuse" ? null : "refuse")}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <FaTimes /> Refuser
        </button>
      </div>

      {mode === "refuse" && (
        <RejectPanel
          label="Motif du refus"
          pending={pending}
          onSubmit={(reason) => run(refusePublicSpaceSubmission, article._id, reason)}
          onCancel={() => setMode(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  CJP submission review                                         */
/* ═══════════════════════════════════════════════════════════════ */

export function CjpSubmissionReview({ article }) {
  const { pending, mode, setMode, toast, run } = useSimpleAction();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => run(approveCjpSubmission, article._id)}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          Publier au CJP
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "refuse" ? null : "refuse")}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <FaTimes /> Refuser
        </button>
      </div>

      {mode === "refuse" && (
        <RejectPanel
          label="Motif du refus"
          pending={pending}
          onSubmit={(reason) => run(refuseCjpSubmission, article._id, reason)}
          onCancel={() => setMode(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Feature CJP in public space (reverse flow)                    */
/* ═══════════════════════════════════════════════════════════════ */

export function FeatureInPublicSpaceActions({ journalArticle }) {
  const { pending, toast, run } = useSimpleAction();
  const isFeatured = !!journalArticle.partnership?.publicArticle;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {isFeatured ? (
          <>
            <Link
              href={`/publicSpace/${journalArticle.partnership.publicArticle}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FaExternalLinkAlt /> Voir
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!confirm("Retirer cet article de l'espace public ?")) return;
                run(unfeatureCjpFromPublicSpace, journalArticle._id);
              }}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaUndo />}
              Retirer
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => run(featureCjpInPublicSpace, journalArticle._id)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaGlobe />}
            Publier dans l'espace public
          </button>
        )}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
