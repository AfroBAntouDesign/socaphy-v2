// src/lib/hooks/useArticles.js
"use client";

import { useCallback, useEffect, useState } from "react";

export function useArticles({ mine = true, status } = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (mine) qs.set("mine", "true");
      if (status) qs.set("status", status);

      const res = await fetch(`/api/articles?${qs}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mine, status]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Suppression échouée");
    }
    setArticles((prev) => prev.filter((a) => a._id !== id));
  };

  const submit = async (id) => {
    const res = await fetch(`/api/articles/${id}/submit`, {
      method: "POST",
      credentials: "include",
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || "Soumission échouée");
    setArticles((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "submitted" } : a))
    );
  };

  return { articles, loading, error, reload: load, remove, submit };
}