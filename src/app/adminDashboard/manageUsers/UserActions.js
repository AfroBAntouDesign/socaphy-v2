// src/app/adminDashboard/manageUsers/UserActions.js
"use client";

import { useTransition, useState } from "react";
import {
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
} from "./actions";

export default function UserActions({ user }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // null | "reject" | "suspend"
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

  /* Statuses that allow action */
  const canApprove = user.status === "pending";
  const canReject = user.status === "pending";
  const canSuspend = user.status === "active";
  const canReactivate =
    user.status === "suspended" || user.status === "rejected";

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Buttons row */}
      <div className="flex flex-wrap justify-end gap-2">
        {canApprove && (
          <button
            onClick={() => run(approveUser, user._id)}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "..." : "Approuver"}
          </button>
        )}

        {canReject && (
          <button
            onClick={() => setMode(mode === "reject" ? null : "reject")}
            disabled={pending}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            Refuser
          </button>
        )}

        {canSuspend && (
          <button
            onClick={() => setMode(mode === "suspend" ? null : "suspend")}
            disabled={pending}
            className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
          >
            Suspendre
          </button>
        )}

        {canReactivate && (
          <button
            onClick={() => run(reactivateUser, user._id)}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "..." : "Réactiver"}
          </button>
        )}
      </div>

      {/* Reason prompt */}
      {mode && (
        <div className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {mode === "reject" ? "Motif du refus" : "Motif de la suspension"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Optionnel — visible par l'utilisateur"
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
              onClick={() =>
                run(mode === "reject" ? rejectUser : suspendUser, user._id, reason)
              }
              disabled={pending}
              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "..." : "Confirmer"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-md px-2 py-1 text-xs ${
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