// src/app/adminDashboard/manageMembers/MemberCard.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  FaUser, FaFileAlt, FaIdCard, FaEye, FaCheck, FaTimes,
  FaBan, FaTrash, FaSpinner, FaArrowDown, FaArrowUp, FaExternalLinkAlt,
} from "react-icons/fa";
import {
  promoteToMember,
  demoteMember,
  suspendMember,
  reactivateMember,
  deleteMember,
} from "./actions";
import { OPEN_REGISTER_ROLES, ROLE_LABELS } from "@/lib/roles";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-orange-50 text-orange-700 ring-orange-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-gray-100 text-gray-700 ring-gray-300",
};

const STATUS_LABELS = {
  active: "Actif",
  pending: "En attente",
  rejected: "Refusé",
  suspended: "Suspendu",
};

/**
 * variant:
 *   "member"    → user is currently adminSOCAphy (show demote/suspend/delete)
 *   "candidate" → user is not adminSOCAphy (show promote)
 */
export default function MemberCard({ user, variant = "member" }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState(null); // null | "demote" | "suspend" | "delete"
  const [newRole, setNewRole] = useState("scientifique");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  const run = (fn, ...args) => {
    startTransition(async () => {
      try {
        const res = await fn(...args);
        setToast({ type: "success", text: res.message });
        setMode(null);
        setReason("");
        setTimeout(() => setToast(null), 3500);
      } catch (err) {
        setToast({ type: "error", text: err.message });
        setTimeout(() => setToast(null), 4500);
      }
    });
  };

  const isMember = variant === "member";
  const statusPill = STATUS_STYLES[user.status] || STATUS_STYLES.active;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Identity */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold text-white">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-gray-900">
                {user.name}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusPill}`}
              >
                {STATUS_LABELS[user.status] || user.status}
              </span>
              {!isMember && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {user.email}
            </p>

            {/* Quick links: CV + Articles */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <Link
                href={`/adminDashboard/manageUsers/${user._id}`}
                className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
              >
                <FaUser /> Profil complet
              </Link>

              {user.hasCv && (
                <Link
                  href={`/adminDashboard/manageUsers/${user._id}#cv`}
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                >
                  <FaIdCard /> Voir le CV
                </Link>
              )}

              {user.articleCount > 0 && (
                <Link
                  href={`/adminDashboard/manageArticles?author=${user._id}`}
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                >
                  <FaFileAlt /> {user.articleCount} article
                  {user.articleCount > 1 ? "s" : ""}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {isMember ? (
              <>
                <Link
                  href={`/adminDashboard/manageUsers/${user._id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <FaEye /> Voir
                </Link>

                {user.status === "active" ? (
                  <>
                    <button
                      onClick={() => setMode(mode === "demote" ? null : "demote")}
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                    >
                      <FaArrowDown /> Rétrograder
                    </button>
                    <button
                      onClick={() => setMode(mode === "suspend" ? null : "suspend")}
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FaBan /> Suspendre
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => run(reactivateMember, user._id)}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {pending ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                    Réactiver
                  </button>
                )}

                <button
                  onClick={() => setMode(mode === "delete" ? null : "delete")}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <FaTrash /> Supprimer
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/adminDashboard/manageUsers/${user._id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <FaEye /> Voir
                </Link>
                <button
                  onClick={() => run(promoteToMember, user._id)}
                  disabled={pending || user.status !== "active"}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  title={
                    user.status !== "active"
                      ? "L'utilisateur doit être actif pour être promu"
                      : undefined
                  }
                >
                  {pending ? <FaSpinner className="animate-spin" /> : <FaArrowUp />}
                  Promouvoir
                </button>
              </>
            )}
          </div>

          {/* DEMOTE panel */}
          {mode === "demote" && (
            <div className="mt-1 w-full max-w-sm rounded-lg border border-orange-200 bg-orange-50 p-3">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Nouveau rôle
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {OPEN_REGISTER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => run(demoteMember, user._id, newRole)}
                  disabled={pending}
                  className="rounded bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {pending ? "..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}

          {/* SUSPEND panel */}
          {mode === "suspend" && (
            <div className="mt-1 w-full max-w-sm rounded-lg border border-gray-300 bg-gray-50 p-3">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Motif de la suspension (optionnel)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => run(suspendMember, user._id, reason)}
                  disabled={pending}
                  className="rounded bg-gray-700 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {pending ? "..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}

          {/* DELETE panel */}
          {mode === "delete" && (
            <div className="mt-1 w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-800">
                <strong>Suppression définitive.</strong> Le compte et son profil
                seront perdus. Les articles et CV resteront en base (orphelins).
              </p>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setMode(null)}
                  className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => run(deleteMember, user._id)}
                  disabled={pending}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {pending ? "..." : "Confirmer la suppression"}
                </button>
              </div>
            </div>
          )}

          {toast && (
            <div
              className={`rounded-md px-3 py-1.5 text-xs ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {toast.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}