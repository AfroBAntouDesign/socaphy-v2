// src/app/adminDashboard/manageCjp/reports/ReportActions.jsx
"use client";

import { useState, useTransition } from "react";
import {
  FaCheck, FaGavel, FaSpinner, FaTimes, FaEye,
} from "react-icons/fa";
import {
  dismissReport, takeActionOnReport, markReportReviewed,
} from "../actions";

export default function ReportActions({ reportId }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // null | "action"
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  const run = (fn, ...args) => {
    startTransition(async () => {
      try {
        const res = await fn(...args);
        setToast({ type: "success", text: res.message });
        setMode(null);
        setAction("");
        setNote("");
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
        <button
          onClick={() => run(markReportReviewed, reportId)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <FaEye /> Marquer vu
        </button>
        <button
          onClick={() => run(dismissReport, reportId)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {pending ? <FaSpinner className="animate-spin" /> : <FaTimes />}
          Classer
        </button>
        <button
          onClick={() => setMode(mode === "action" ? null : "action")}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          <FaGavel /> Prendre action
        </button>
      </div>

      {mode === "action" && (
        <div className="w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-3">
          <label className="mb-1 block text-xs font-medium text-red-900">
            Action (min 5 caractères)
          </label>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Ex : Commentaire masqué"
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <label className="mt-2 mb-1 block text-xs font-medium text-red-900">
            Note interne (optionnel)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => { setMode(null); setAction(""); setNote(""); }}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={() => run(takeActionOnReport, reportId, action, note)}
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
