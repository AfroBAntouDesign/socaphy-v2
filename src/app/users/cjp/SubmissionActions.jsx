// src/app/users/cjp/SubmissionActions.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaPaperPlane, FaTrash, FaSpinner, FaEye,
} from "react-icons/fa";

export default function SubmissionActions({ article }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const submit = () => {
    if (!confirm("Soumettre cet article pour évaluation ? Vous ne pourrez plus le modifier.")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cjp/articles/${article._id}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Échec (${res.status})`);
        setToast({ type: "success", text: data.message || "Article soumis" });
        router.refresh();
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 6000);
      }
    });
  };

  const remove = () => {
    if (!confirm("Supprimer ce brouillon ? Cette action est irréversible.")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cjp/articles/${article._id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Échec (${res.status})`);
        router.refresh();
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 6000);
      }
    });
  };

  const isDraft = article.status === "draft";
  const isPublished = article.status === "published";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {isDraft && (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              Soumettre
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <FaTrash /> Supprimer
            </button>
          </>
        )}

        {isPublished && (
          <Link
            href={`/cjp/articles/${article._id}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FaEye /> Voir public
          </Link>
        )}
      </div>

      {toast && (
        <div
          className={`max-w-xs rounded-md px-3 py-1.5 text-xs ${
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
