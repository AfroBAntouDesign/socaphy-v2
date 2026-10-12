// src/app/adminDashboard/manageCjp/board/BoardManager.jsx
"use client";

import { useState, useTransition } from "react";
import {
  FaPlus, FaEdit, FaTrash, FaSpinner, FaTimes, FaCheck,
} from "react-icons/fa";
import {
  createBoardMember, updateBoardMember, deleteBoardMember,
} from "../actions";
import { BOARD_ROLES, BOARD_ROLE_LABELS } from "@/lib/cjp";

const EMPTY = {
  name: "", title: "", role: "editor", affiliation: "",
  email: "", orcid: "", photo: "", biography: "", order: 0, isActive: true,
};

export default function BoardManager({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState(null); // null | "new" | memberId
  const [form, setForm] = useState(EMPTY);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const grouped = BOARD_ROLES.reduce((acc, r) => {
    acc[r.value] = members.filter((m) => m.role === r.value);
    return acc;
  }, {});

  const openNew = (role = "editor") => {
    setEditing("new");
    setForm({ ...EMPTY, role });
  };

  const openEdit = (m) => {
    setEditing(m._id);
    setForm({
      name: m.name || "",
      title: m.title || "",
      role: m.role || "editor",
      affiliation: m.affiliation || "",
      email: m.email || "",
      orcid: m.orcid || "",
      photo: m.photo || "",
      biography: m.biography || "",
      order: m.order ?? 0,
      isActive: m.isActive !== false,
    });
  };

  const close = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const save = () => {
    startTransition(async () => {
      try {
        const payload = { ...form, order: Number(form.order) || 0 };
        if (editing === "new") {
          const res = await createBoardMember(payload);
          // Local refresh via server revalidation happens automatically
          setToast({ type: "success", text: res.message });
        } else {
          const res = await updateBoardMember(editing, payload);
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

  const remove = (m) => {
    if (!confirm(`Supprimer ${m.name} du comité ?`)) return;
    startTransition(async () => {
      try {
        const res = await deleteBoardMember(m._id);
        setToast({ type: "success", text: res.message });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ type: "error", text: err.message });
      }
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {members.length} membre{members.length > 1 ? "s" : ""} au total
        </p>
        <button
          type="button"
          onClick={() => openNew("editor")}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaPlus /> Ajouter un membre
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

      {/* Groups */}
      {BOARD_ROLES.map((r) => (
        <section key={r.value} className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              {r.label}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({grouped[r.value].length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => openNew(r.value)}
              className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
              title={`Ajouter un ${r.label}`}
            >
              <FaPlus className="text-xs" />
            </button>
          </div>

          {grouped[r.value].length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Aucun membre dans cette catégorie.
            </p>
          ) : (
            <ul className="space-y-2">
              {grouped[r.value]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((m) => (
                  <li
                    key={m._id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white">
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        m.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {m.title && <span className="text-emerald-700">{m.title} </span>}
                        {m.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {[m.affiliation, m.email].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                        aria-label="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(m)}
                        disabled={pending}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ))}

      {/* Modal */}
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
                {editing === "new" ? "Ajouter un membre" : "Modifier le membre"}
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
              <ModalField label="Nom complet" name="name" value={form.name} onChange={onChange} required />
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Titre (Prof., Dr.)" name="title" value={form.title} onChange={onChange} />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Rôle
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {BOARD_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ModalField label="Affiliation" name="affiliation" value={form.affiliation} onChange={onChange} />
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Email" name="email" value={form.email} onChange={onChange} type="email" />
                <ModalField label="ORCID" name="orcid" value={form.orcid} onChange={onChange} />
              </div>
              <ModalField label="Photo (URL)" name="photo" value={form.photo} onChange={onChange} />
              <ModalField label="Biographie" name="biography" value={form.biography} onChange={onChange} textarea rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Ordre d'affichage" name="order" value={form.order} onChange={onChange} type="number" />
                <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Actif (visible publiquement)
                </label>
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
