// src/app/adminDashboard/manageCjp/issues/IssuesManager.jsx
"use client";

import { useState, useTransition } from "react";
import {
  FaPlus, FaEdit, FaTrash, FaSpinner, FaTimes, FaCheck,
  FaStar, FaLayerGroup,
} from "react-icons/fa";
import { createIssue, updateIssue, deleteIssue, setCurrentIssue } from "../actions";

const EMPTY = {
  volume: "", number: "", year: new Date().getFullYear(),
  title: "", editorial: "", publishDate: "", coverImage: "", status: "upcoming",
};

const STATUS_META = {
  upcoming: { label: "À venir", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  current: { label: "En cours", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  archived: { label: "Archivé", pill: "bg-blue-50 text-blue-700 ring-blue-200" },
};

export default function IssuesManager({ initialIssues }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const openNew = () => {
    setEditing("new");
    // Auto-suggest next volume/number
    const max = initialIssues.reduce(
      (acc, i) => ({
        volume: Math.max(acc.volume, i.volume),
        number: Math.max(acc.number, i.number),
      }),
      { volume: 1, number: 0 }
    );
    setForm({
      ...EMPTY,
      volume: max.volume,
      number: max.number + 1,
      year: new Date().getFullYear(),
    });
  };

  const openEdit = (i) => {
    setEditing(i._id);
    setForm({
      volume: i.volume, number: i.number, year: i.year,
      title: i.title || "", editorial: i.editorial || "",
      publishDate: i.publishDate ? i.publishDate.slice(0, 10) : "",
      coverImage: i.coverImage || "", status: i.status || "upcoming",
    });
  };

  const close = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = () => {
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          volume: Number(form.volume),
          number: Number(form.number),
          year: Number(form.year),
        };
        if (editing === "new") {
          const res = await createIssue(payload);
          setToast({ type: "success", text: res.message });
        } else {
          const res = await updateIssue(editing, payload);
          setToast({ type: "success", text: res.message });
        }
        close();
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  const remove = (i) => {
    if (!confirm(`Supprimer Vol. ${i.volume}, No. ${i.number} ?`)) return;
    startTransition(async () => {
      try {
        const res = await deleteIssue(i._id);
        setToast({ type: "success", text: res.message });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
      }
    });
  };

  const markCurrent = (i) => {
    startTransition(async () => {
      try {
        const res = await setCurrentIssue(i._id);
        setToast({ type: "success", text: res.message });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {initialIssues.length} numéro{initialIssues.length > 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaPlus /> Nouveau numéro
        </button>
      </div>

      {toast && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {initialIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-4xl">📚</p>
          <p className="mt-3 font-medium text-gray-800">Aucun numéro créé</p>
          <p className="mt-1 text-sm text-gray-500">
            Créez le premier numéro du journal.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {initialIssues.map((i) => {
            const meta = STATUS_META[i.status] || STATUS_META.upcoming;
            return (
              <li
                key={i._id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FaLayerGroup className="text-lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-gray-900">
                        Vol. {i.volume}, No. {i.number}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}>
                        {meta.label}
                      </span>
                      {i.status === "current" && (
                        <FaStar className="text-orange-500" title="Numéro en cours" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {i.year}
                      {i.title && ` — ${i.title}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {i.articleCount || 0} article{(i.articleCount || 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {i.status !== "current" && (
                    <button
                      type="button"
                      onClick={() => markCurrent(i)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                    >
                      <FaStar /> En cours
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(i)}
                    className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
                    aria-label="Modifier"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={pending}
                    className="rounded-md border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    aria-label="Supprimer"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing === "new" ? "Créer un numéro" : "Modifier le numéro"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <ModalField label="Volume" name="volume" value={form.volume} onChange={onChange} type="number" required />
                <ModalField label="Numéro" name="number" value={form.number} onChange={onChange} type="number" required />
                <ModalField label="Année" name="year" value={form.year} onChange={onChange} type="number" required />
              </div>
              <ModalField label="Titre (optionnel)" name="title" value={form.title} onChange={onChange} placeholder="Ex : Volume inaugural" />
              <ModalField label="Éditorial du numéro" name="editorial" value={form.editorial} onChange={onChange} textarea rows={4} />
              <ModalField label="Date de publication" name="publishDate" value={form.publishDate} onChange={onChange} type="date" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="upcoming">À venir</option>
                  <option value="current">En cours</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {editing === "new" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalField({ label, textarea, rows = 3, ...props }) {
  const cls = "w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea id={props.name} rows={rows} {...props} className={`${cls} resize-y`} />
      ) : (
        <input id={props.name} {...props} className={cls} />
      )}
    </div>
  );
}
