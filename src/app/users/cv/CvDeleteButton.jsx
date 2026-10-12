// src/app/users/cv/CvDeleteButton.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaTrash, FaSpinner } from "react-icons/fa";

export default function CvDeleteButton({ cvId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm("Retirer ce CV en attente ? Cette action est irréversible.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cv/${cvId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaTrash />}
      Retirer le CV
    </button>
  );
}