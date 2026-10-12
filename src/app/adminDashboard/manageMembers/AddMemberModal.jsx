// src/app/adminDashboard/manageMembers/AddMemberModal.jsx
"use client";

import { useState, useTransition } from "react";
import { FaPlus, FaTimes, FaSpinner, FaCheck } from "react-icons/fa";
import { createMember } from "./actions";

export default function AddMemberModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reset = () => {
    setForm({ name: "", email: "", password: "" });
    setErrors({});
    setGlobalError("");
    setSuccess("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = (e) => {
    e.preventDefault();
    setGlobalError("");
    setErrors({});
    setSuccess("");

    const local = {};
    if (form.name.trim().length < 2) local.name = "Nom trop court";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = "Email invalide";
    if (form.password.length < 8) local.password = "Au moins 8 caractères";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      local.password = "Doit contenir lettre et chiffre";

    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    startTransition(async () => {
      try {
        const res = await createMember(form);
        setSuccess(res.message);
        setForm({ name: "", email: "", password: "" });
        setTimeout(() => close(), 1800);
      } catch (err) {
        setGlobalError(err.message);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <FaPlus /> Ajouter un membre
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Ajouter un Membre SOCAphy
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Le compte sera actif immédiatement.
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <FaTimes />
              </button>
            </div>

            {globalError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {globalError}
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <FaCheck /> {success}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field
                label="Nom complet"
                name="name"
                value={form.name}
                onChange={onChange}
                error={errors.name}
                placeholder="Ex : Dr. Marie Ngo"
                autoFocus
                required
              />
              <Field
                label="Adresse email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                error={errors.email}
                placeholder="membre@socaphy.cm"
                autoComplete="off"
                required
              />
              <Field
                label="Mot de passe provisoire"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                error={errors.password}
                hint="L'utilisateur pourra le changer depuis son profil"
                autoComplete="new-password"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pending ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  {pending ? "Création…" : "Créer le membre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, error, hint, ...props }) {
  const cls = `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/20"
  }`;
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input id={props.name} {...props} className={cls} />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}