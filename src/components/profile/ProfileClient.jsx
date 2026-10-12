// src/components/profile/ProfileClient.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  FaCamera, FaTrash, FaSave, FaLock, FaFileAlt, FaUser,
  FaSpinner, FaCheckCircle, FaExclamationCircle, FaSpinner as FaSpin,
} from "react-icons/fa";
import { ROLE_LABELS } from "@/lib/roles";

/* Where each author role finds its articles */
const ARTICLES_HOME = {
  scientifique: "/users/scientifique/articles",
  clinic: "/users/clinic/articles",
  praticienSante: "/users/praticienSante/articles",
  tradiPraticien: "/users/tradiPraticien/articles",
  adminSOCAphy: "/users/adminSOCAphy/articles",
};

export default function ProfileClient({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const articlesHome = ARTICLES_HOME[user.role];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        <AvatarBlock
          user={user}
          onUpdate={(avatar) => {
            setUser((u) => ({ ...u, avatar }));
            router.refresh();
          }}
          onToast={showToast}
        />

        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <span className="text-xs text-gray-400">
              Membre depuis{" "}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick action — manage my articles */}
      {articlesHome && (
        <Link
          href={articlesHome}
          className="mb-8 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FaFileAlt className="text-lg" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Mes articles</h2>
              <p className="text-sm text-gray-500">
                Gérer, modifier et soumettre mes publications
              </p>
            </div>
          </div>
          <span className="text-emerald-700">→</span>
        </Link>
      )}

      {/* Info form */}
      <InfoSection
        user={user}
        onUpdate={(u) => {
          setUser((prev) => ({ ...prev, ...u }));
          router.refresh();
        }}
        onToast={showToast}
      />

      {/* Password form */}
      <PasswordSection onToast={showToast} />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  AVATAR                                                          */
/* ═══════════════════════════════════════════════════════════════ */

function AvatarBlock({ user, onUpdate, onToast }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/auth/me/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");
      onUpdate(data.avatar);
      onToast("success", "Photo mise à jour");
    } catch (err) {
      setError(err.message);
      onToast("error", err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!confirm("Supprimer votre photo de profil ?")) return;
    setUploading(true);
    try {
      const res = await fetch("/api/auth/me/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(null);
      onToast("success", "Photo supprimée");
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-lg ring-1 ring-gray-200">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-4xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <FaSpinner className="animate-spin text-2xl text-white" />
          </div>
        )}
      </div>

      <div className="absolute -bottom-1 -right-1 flex gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Changer la photo"
          title="Changer la photo"
        >
          <FaCamera className="text-sm" />
        </button>

        {user.avatar && (
          <button
            type="button"
            onClick={remove}
            disabled={uploading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow-md ring-1 ring-gray-200 transition hover:bg-red-50 disabled:opacity-50"
            aria-label="Supprimer la photo"
            title="Supprimer la photo"
          >
            <FaTrash className="text-sm" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {error && (
        <p className="mt-2 max-w-[8rem] text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  INFO                                                            */
/* ═══════════════════════════════════════════════════════════════ */

function InfoSection({ user, onUpdate, onToast }) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    description: user.description || "",
    biography: user.biography || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Échec de la mise à jour");
      }
      onUpdate(data.user);
      onToast("success", "Profil mis à jour");
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <FaUser />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Informations personnelles</h2>
          <p className="text-xs text-gray-500">
            Nom, email, coordonnées et présentation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom complet" name="name" value={form.name} onChange={onChange} error={errors.name} required />
        <Field label="Adresse email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} required />
        <Field label="Téléphone" name="phone" value={form.phone} onChange={onChange} error={errors.phone} placeholder="+237 6 XX XX XX XX" />
        <Field label="Adresse" name="address" value={form.address} onChange={onChange} error={errors.address} placeholder="Ville, pays" />
      </div>

      <div className="mt-4">
        <Field
          label="Description courte"
          name="description"
          value={form.description}
          onChange={onChange}
          error={errors.description}
          placeholder="Ex : Chercheur en phytothérapie, spécialisé en plantes antipaludiques"
          maxLength={500}
        />
      </div>

      <div className="mt-4">
        <Field
          label="Biographie"
          name="biography"
          value={form.biography}
          onChange={onChange}
          error={errors.biography}
          textarea
          rows={4}
          placeholder="Parcours, expertises, contributions…"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <FaSpin className="animate-spin" /> : <FaSave />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PASSWORD                                                        */
/* ═══════════════════════════════════════════════════════════════ */

function PasswordSection({ onToast }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});

    const local = {};
    if (form.newPassword.length < 8) local.newPassword = "Au moins 8 caractères";
    else if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword))
      local.newPassword = "Doit contenir lettre et chiffre";
    if (form.newPassword !== form.confirm) local.confirm = "Les mots de passe diffèrent";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) setErrors(data.details);
        throw new Error(data.error || "Échec");
      }
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      onToast("success", "Mot de passe modifié");
    } catch (err) {
      onToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <FaLock />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Mot de passe</h2>
          <p className="text-xs text-gray-500">
            Modifiez votre mot de passe de connexion
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field
          label="Mot de passe actuel"
          name="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={onChange}
          error={errors.currentPassword}
          required
          autoComplete="current-password"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Nouveau mot de passe"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={onChange}
            error={errors.newPassword}
            hint="8 caractères min, avec lettre et chiffre"
            required
            autoComplete="new-password"
          />
          <Field
            label="Confirmer le nouveau"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={onChange}
            error={errors.confirm}
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? <FaSpin className="animate-spin" /> : <FaLock />}
          {saving ? "Modification…" : "Modifier le mot de passe"}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Field                                                           */
/* ═══════════════════════════════════════════════════════════════ */

function Field({ label, error, hint, textarea, rows = 3, ...props }) {
  const cls = `w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:bg-white focus:outline-none focus:ring-2 ${
    error
      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 bg-gray-50 focus:border-emerald-500 focus:ring-emerald-500/20"
  }`;

  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {textarea ? (
        <textarea id={props.name} rows={rows} {...props} className={`${cls} resize-y`} />
      ) : (
        <input id={props.name} {...props} className={cls} />
      )}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}