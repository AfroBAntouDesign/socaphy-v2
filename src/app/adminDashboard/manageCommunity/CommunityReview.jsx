// src/app/adminDashboard/manageCommunity/CommunityReview.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FaCheck, FaTimes, FaSpinner, FaArchive, FaUndo, FaExternalLinkAlt,
} from "react-icons/fa";
import {
  approveCommunity,
  rejectCommunity,
  archiveCommunity,
  reactivateCommunity,
} from "./actions";

export default function CommunityReview({ community }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null);
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

  const isPending = community.status === "pending";
  const isActive = community.status === "active";
  const isArchived = community.status === "archived";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {isPending && (
          <>
            <button
              onClick={() => run(approveCommunity, community._id)}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Approuver
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

        {isActive && (
          <button
            onClick={() => run(archiveCommunity, community._id)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaArchive />}
            Archiver
          </button>
        )}

        {isArchived && (
          <button
            onClick={() => run(reactivateCommunity, community._id)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaUndo />}
            Réactiver
          </button>
        )}

        <Link
          href={`/users/communaute/${community._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <FaExternalLinkAlt /> Voir
        </Link>
      </div>

      {mode === "reject" && (
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Motif du refus (min 5 caractères)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
              onClick={() => run(rejectCommunity, community._id, reason)}
              disabled={pending}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "..." : "Confirmer"}
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