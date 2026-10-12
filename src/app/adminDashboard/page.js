// src/app/adminDashboard/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaUsers, FaUserCheck, FaUserClock, FaUserSlash, FaUserTimes,
  FaFileAlt, FaArchive, FaClinicMedical, FaComments, FaIdCard,
  FaUserMd, FaStore, FaGlobe,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";

/* ------------------------------------------------------------------ */
/*  Server-side helpers                                                */
/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getStats() {
  await connectDB();
  const [total, active, pending, suspended, rejected] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "pending" }),
    User.countDocuments({ status: "suspended" }),
    User.countDocuments({ status: "rejected" }),
  ]);
  return { total, active, pending, suspended, rejected };
}

async function getPendingUsers(limit = 5) {
  await connectDB();
  return User.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("name email role createdAt")
    .lean();
}

/* ------------------------------------------------------------------ */
/*  Section config — mirrors the cahier des fonctionnalités            */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  {
    href: "/adminDashboard/manageUsers",
    label: "Utilisateurs",
    desc: "Valider, suspendre, gérer les comptes",
    icon: FaUsers,
  },
  {
    href: "/adminDashboard/manageCv",
    label: "Validation CV",
    desc: "Candidatures et CV soumis",
    icon: FaIdCard,
  },
  {
    href: "/adminDashboard/manageArticles",
    label: "Articles",
    desc: "Modérer les publications",
    icon: FaFileAlt,
  },
  {
    href: "/adminDashboard/manageArchives",
    label: "Archives médicales",
    desc: "Protocoles ancestraux",
    icon: FaArchive,
  },
  {
    href: "/adminDashboard/manageClinics",
    label: "Cliniques",
    desc: "Annuaire et validation",
    icon: FaClinicMedical,
  },
  {
    href: "/adminDashboard/managePraticiens",
    label: "Praticiens",
    desc: "Praticiens traditionnels",
    icon: FaUserMd,
  },
  {
    href: "/adminDashboard/manageCommunity",
    label: "Communauté",
    desc: "Modération et groupes",
    icon: FaComments,
  },
  {
    href: "/market",
    label: "Marché",
    desc: "Produits naturels",
    icon: FaStore,
  },
  {
    href: "/publicSpace",
    label: "Place publique",
    desc: "Articles visibles publiquement",
    icon: FaGlobe,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Tableau de bord | Admin SOCAphy",
};

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session || session.role !== "superAdmin") {
    redirect("/superadmin");
  }

  const [stats, pendingUsers] = await Promise.all([
    getStats(),
    getPendingUsers(5),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme SOCAphy"
        action={{ href: "/adminDashboard/manageUsers", label: "Gérer les utilisateurs" }}
      />

      {/* ── Stat cards ── */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Statistiques
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Utilisateurs" value={stats.total} icon={FaUsers} accent="emerald" />
          <StatCard label="Actifs" value={stats.active} icon={FaUserCheck} accent="emerald" hint="Comptes en règle" />
          <StatCard label="En attente" value={stats.pending} icon={FaUserClock} accent="orange" hint="À valider" />
          <StatCard label="Suspendus" value={stats.suspended} icon={FaUserSlash} accent="red" hint="Accès bloqué" />
          <StatCard label="Rejetés" value={stats.rejected} icon={FaUserTimes} accent="gray" hint="Demandes refusées" />
        </div>
      </section>

      {/* ── Sections grid ── */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Sections
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="text-lg" aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-800">
                  {label}
                </h3>
                <p className="mt-0.5 text-sm text-gray-600">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Pending users preview ── */}
      <section>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Comptes en attente
              </h2>
              <p className="text-sm text-gray-500">
                {stats.pending === 0
                  ? "Aucune demande"
                  : `${stats.pending} demande${stats.pending > 1 ? "s" : ""} à traiter`}
              </p>
            </div>
            <Link
              href="/adminDashboard/manageUsers?status=pending"
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Tout voir
            </Link>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 text-sm text-gray-500">
                Aucune demande en attente pour le moment.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendingUsers.map((u) => (
                <li
                  key={u._id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {u.name}
                    </p>
                    <p className="truncate text-sm text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                    <span className="hidden text-xs text-gray-400 sm:inline">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}