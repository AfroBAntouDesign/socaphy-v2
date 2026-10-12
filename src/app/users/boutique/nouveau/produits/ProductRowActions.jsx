// src/app/users/boutique/produits/ProductRowActions.jsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaTrash, FaSpinner } from "react-icons/fa";

export default function ProductRowActions({ product }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Supprimer "${product.name}" ? Cette action est irréversible.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
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
      type="button"
      onClick={remove}
      disabled={busy}
      className="rounded-md p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      title="Supprimer"
    >
      {busy ? <FaSpinner className="animate-spin" /> : <FaTrash />}
    </button>
  );
}