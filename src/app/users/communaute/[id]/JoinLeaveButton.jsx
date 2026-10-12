// src/app/users/communaute/[id]/JoinLeaveButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaUserPlus, FaSignOutAlt, FaSpinner } from "react-icons/fa";

export default function JoinLeaveButton({ communityId, isMember, isCreator, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isCreator) {
    return (
      <span className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        Vous avez créé cette communauté
      </span>
    );
  }

  if (status !== "active") return null;

  const action = async (path, confirmText) => {
    if (!confirm(confirmText)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/communities/${communityId}/${path}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {isMember ? (
        <button
          type="button"
          onClick={() => action("leave", "Quitter cette communauté ?")}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? <FaSpinner className="animate-spin" /> : <FaSignOutAlt />}
          Quitter
        </button>
      ) : (
        <button
          type="button"
          onClick={() => action("join", "Rejoindre cette communauté ?")}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
          Rejoindre
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}