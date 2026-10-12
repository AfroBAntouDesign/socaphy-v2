// src/components/partnership/SubmitToCjpButton.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaBook, FaPaperPlane, FaSpinner, FaCheckCircle,
  FaClock, FaTimesCircle, FaExternalLinkAlt,
} from "react-icons/fa";

export default function SubmitToCjpButton({ article, canSubmit }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const status = article.partnership?.cjpSubmissionStatus || "none";
  const isDraft = article.status !== "validated";

  // Hide everything if the article isn't validated or user can't submit
  if (isDraft && status === "none") return null;
  if (!canSubmit && status === "none") return null;

  const submit = () => {
    if (!confirm("Soumettre cet article au Cameroonian Journal of Phytotherapae ?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/articles/${article._id}/submit-to-cjp`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        setToast({ type: "success", text: data.message });
        router.refresh();
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 5000);
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FaBook className="text-emerald-700" />
        <h3 className="text-sm font-semibold text-gray-900">
          Publication au Journal CJP
        </h3>
      </div>

      {/* Status */}
      {status === "none" && canSubmit && !isDraft && (
        <>
          <p className="mb-3 text-xs text-gray-600">
            Soumettez cet article au comité scientifique du journal pour une
            publication dans le Cameroonian Journal of Phytotherapae.
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            Soumettre au CJP
          </button>
        </>
      )}

      {status === "pending" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-orange-900">
            <FaClock /> En attente de validation CJP
          </p>
          <p className="mt-1 text-xs text-orange-800">
            Votre article a été soumis au comité scientifique. Vous serez
            notifié de la décision.
          </p>
        </div>
      )}

      {status === "approved" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            <FaCheckCircle /> Publié au CJP
          </p>
          {article.partnership?.cjpId && (
            <p className="mt-1 font-mono text-xs text-emerald-800">
              {article.partnership.cjpId}
            </p>
          )}
          {article.partnership?.cjpArticle && (
            <Link
              href={`/cjp/articles/${article.partnership.cjpArticle}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Voir la publication CJP <FaExternalLinkAlt className="text-[10px]" />
            </Link>
          )}
        </div>
      )}

      {status === "refused" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-red-900">
            <FaTimesCircle /> Refusé par le CJP
          </p>
          {article.partnership?.cjpRefusalReason && (
            <p className="mt-1 text-xs text-red-800">
              Motif : {article.partnership.cjpRefusalReason}
            </p>
          )}
          {canSubmit && (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              Resoumettre
            </button>
          )}
        </div>
      )}

      {toast && (
        <div
          className={`mt-3 rounded-md px-3 py-2 text-xs ${
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
