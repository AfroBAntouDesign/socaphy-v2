// src/app/users/scientifique/articles/page.js
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaPaperPlane, FaTrash, FaArrowLeft } from "react-icons/fa";

const TABS = [
  { key: "all", label: "Tous" },
  { key: "draft", label: "Brouillons" },
  { key: "submitted", label: "Soumis" },
  { key: "validated", label: "Validés" },
  { key: "rejected", label: "Refusés" },
];

const STATUS_META = {
  draft: { label: "Brouillon", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  submitted: { label: "Soumis", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  validated: { label: "Validé", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Refusé", pill: "bg-red-50 text-red-700 ring-red-200" },
  archived: { label: "Archivé", pill: "bg-gray-100 text-gray-600 ring-gray-200" },
};

export default function MyArticlesPage() {
  const [tab, setTab] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ mine: "true" });
      if (tab !== "all") qs.set("status", tab);
      const res = await fetch(`/api/articles?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const remove = async (id) => {
    if (!confirm("Supprimer ce brouillon ?")) return;
    const res = await fetch(`/api/articles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }
    load();
  };

  const submit = async (id) => {
    if (!confirm("Soumettre cet article pour validation ?")) return;
    const res = await fetch(`/api/articles/${id}/submit`, {
      method: "POST",
      credentials: "include",
    });
    const d = await res.json();
    if (!res.ok) {
      alert(d.error);
      return;
    }
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/scientifique"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Tableau de bord
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mes articles</h1>
          <p className="mt-1 text-sm text-gray-600">Gérez vos brouillons et publications.</p>
        </div>
        <Link
          href="/users/scientifique/nouveau"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaPlus /> Nouvel article
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-500">Chargement…</p>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-3xl">📝</p>
          <p className="mt-2 font-medium text-gray-900">Aucun article</p>
          <p className="mt-1 text-sm text-gray-500">Créez votre premier article pour commencer.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.draft;
            return (
              <li
                key={a._id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/users/scientifique/articles/${a._id}`}
                    className="block truncate font-medium text-gray-900 hover:text-emerald-700"
                  >
                    {a.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(a.updatedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/users/scientifique/articles/${a._id}`}
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                    title="Modifier"
                  >
                    <FaEdit />
                  </Link>
                  {a.status === "draft" && (
                    <>
                      <button
                        onClick={() => submit(a._id)}
                        className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
                        title="Soumettre"
                      >
                        <FaPaperPlane />
                      </button>
                      <button
                        onClick={() => remove(a._id)}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}