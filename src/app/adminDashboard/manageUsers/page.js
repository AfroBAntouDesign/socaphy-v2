// src/app/adminDashboard/manageUsers/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import UserActions from "./UserActions";

/* ------------------------------------------------------------------ */

const TABS = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "En attente" },
  { key: "active", label: "Actifs" },
  { key: "rejected", label: "Rejetés" },
  { key: "suspended", label: "Suspendus" },
];

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

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await User.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listUsers(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return User.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .select("name email role status verified createdAt rejectionReason")
    .lean();
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Utilisateurs | Admin SOCAphy",
};

export default async function ManageUsersPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "all";

  const [counts, users] = await Promise.all([
    countByStatus(),
    listUsers(status),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Gestion des utilisateurs"
        subtitle="Consultez, validez, refusez ou suspendez les comptes de la plateforme"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageUsers?status=${t.key}`}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📭</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              Aucun utilisateur dans cette catégorie
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Changez de filtre ou attendez de nouvelles inscriptions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">
                    Inscription
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/adminDashboard/manageUsers/${u._id}`}
                        className="group block min-w-0"
                      >
                        <p className="font-medium text-gray-900 group-hover:text-emerald-700 group-hover:underline">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {u.email}
                        </p>
                        {u.rejectionReason && (
                          <p className="mt-1 max-w-xs truncate text-xs italic text-red-500">
                            Motif : {u.rejectionReason}
                          </p>
                        )}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                          STATUS_STYLES[u.status] || STATUS_STYLES.active
                        }`}
                      >
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                    </td>

                    <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/adminDashboard/manageUsers/${u._id}`}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Voir
                        </Link>
                        <UserActions
                          user={{
                            _id: u._id.toString(),
                            name: u.name,
                            status: u.status,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {users.length} utilisateur{users.length > 1 ? "s" : ""} affiché
        {users.length > 1 ? "s" : ""} (limite 200)
      </p>
    </div>
  );
}