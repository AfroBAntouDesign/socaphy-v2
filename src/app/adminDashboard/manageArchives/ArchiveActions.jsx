// src/app/adminDashboard/manageArchives/ArchiveActions.jsx
"use client";

import { useState, useTransition } from "react";
import {
  FaArchive, FaUndo, FaSpinner, FaEye, FaDownload,
} from "react-icons/fa";
import { archiveArticle, unarchiveArticle } from "./actions";

export default function ArchiveActions({ article, variant = "archive" }) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const run = (fn) => {
    startTransition(async () => {
      try {
        const res = await fn(article._id);
        setToast({ type: "success", text: res.message });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {variant === "archive" ? (
          <button
            type="button"
            onClick={() => run(archiveArticle)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            title="Retirer de la place publique"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaArchive />}
            Archiver
          </button>
        ) : (
          <button
            type="button"
            onClick={() => run(unarchiveArticle)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            title="Remettre sur la place publique"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaUndo />}
            Restaurer
          </button>
        )}

        <a
          href={`/publicSpace/${article._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          title="Voir la page publique"
        >
          <FaEye /> Voir
        </a>
      </div>

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