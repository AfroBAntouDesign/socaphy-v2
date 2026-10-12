// src/app/adminDashboard/manageShops/ShopReview.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FaCheck, FaTimes, FaSpinner, FaBan, FaUndo, FaExternalLinkAlt,
} from "react-icons/fa";
import {
  approveShop, rejectShop, suspendShop, reactivateShop,
} from "./actions";

export default function ShopReview({ shop }) {
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

  const canApprove = shop.status === "pending";
  const canReject = shop.status === "pending";
  const canSuspend = shop.status === "active";
  const canReactivate = shop.status === "suspended" || shop.status === "rejected";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {canApprove && (
          <button
            onClick={() => run(approveShop, shop._id)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            Approuver
          </button>
        )}
        {canReject && (
          <button
            onClick={() => setMode(mode === "reject" ? null : "reject")}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <FaTimes /> Refuser
          </button>
        )}
        {canSuspend && (
          <button
            onClick={() => setMode(mode === "suspend" ? null : "suspend")}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FaBan /> Suspendre
          </button>
        )}
        {canReactivate && (
          <button
            onClick={() => run(reactivateShop, shop._id)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? <FaSpinner className="animate-spin" /> : <FaUndo />}
            Réactiver
          </button>
        )}
        <Link
          href={`/adminDashboard/manageShops/${shop._id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <FaExternalLinkAlt /> Détail
        </Link>
      </div>

      {mode && (
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {mode === "reject" ? "Motif du refus" : "Motif de la suspension"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
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
              onClick={() => run(mode === "reject" ? rejectShop : suspendShop, shop._id, reason)}
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