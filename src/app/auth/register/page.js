// src/app/auth/register/page.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PUBLIC_REGISTER_ROLES, OPEN_REGISTER_ROLES, ROLE_LABELS } from "@/lib/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "patient",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Nom trop court";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Email invalide";
    if (form.password.length < 8) e.password = "Au moins 8 caractères";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      e.password = "Doit contenir lettre et chiffre";
    if (form.password !== form.confirm) e.confirm = "Les mots de passe diffèrent";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setPendingMessage("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (res.status === 202) {
        setPendingMessage(
          data.message ||
            "Votre demande a bien été enregistrée. Un administrateur validera votre compte."
        );
        setTimeout(() => router.push("/auth/pending"), 2500);
        return;
      }

      if (!res.ok) {
        setGlobalError(data.error || "Échec de l'inscription");
        if (data.details) setErrors(data.details);
        return;
      }

      router.push(data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setGlobalError("Erreur serveur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isPendingRole = !OPEN_REGISTER_ROLES.includes(form.role);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Créer un compte
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Rejoignez la communauté SOCAphy
            </p>
          </div>

          {/* Global error */}
          {globalError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {globalError}
            </div>
          )}

          {/* Pending message */}
          {pendingMessage && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              {pendingMessage}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field
              label="Nom complet"
              name="name"
              value={form.name}
              onChange={onChange}
              error={errors.name}
              autoComplete="name"
              placeholder="Ex : Marie Ngo"
            />

            <Field
              label="Adresse email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              error={errors.email}
              autoComplete="email"
              placeholder="vous@exemple.com"
            />

            <Field
              label="Mot de passe"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              error={errors.password}
              autoComplete="new-password"
              placeholder="••••••••"
              hint="8 caractères min, avec lettre et chiffre"
            />

            <Field
              label="Confirmer le mot de passe"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={onChange}
              error={errors.confirm}
              autoComplete="new-password"
              placeholder="••••••••"
            />

            <div>
              <label
                htmlFor="role"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Profil
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {PUBLIC_REGISTER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              {isPendingRole && (
                <p className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
                  ⚠️ Ce profil nécessite une validation par un administrateur
                  SOCAphy avant activation.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-600/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? "Création en cours..." : "S'inscrire"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Déjà inscrit ?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <div>
      <label
        htmlFor={props.name}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={props.name}
        {...props}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/20"
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}