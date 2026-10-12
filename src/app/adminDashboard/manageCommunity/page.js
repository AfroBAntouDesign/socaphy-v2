// src/app/adminDashboard/manageCommunity/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import CommunityReview from "./CommunityReview";

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "active", label: "Actives" },
  { key: "rejected", label: "Refusées" },
  { key: "archived", label: "Archivées" },
  { key: "all", label: "Toutes" },
];

const STATUS_META = {
  pending: { label: "En attente", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  active: { label: "Active", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Refusée", pill: "bg-red-50 text-red-700 ring-red-200" },
  archived: { label: "Archivée", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
};

const CATEGORY_LABEL = {
  treatment: "Traitement",
  practice: "Pratique",
  product: "Produits",
  academic: "Recherche",
  other: "Autre",
};

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await Community.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listCommunities(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return Community.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("creator", "name email role")
    .select("name description category isPublic memberCount postCount status creator createdAt rejectionReason")
    .lean();
}

export const metadata = {
  title: "Communautés | Admin SOCAphy",
};

export default async function ManageCommunityPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "pending";

  const [counts, communities] = await Promise.all([
    countByStatus(),
    listCommunities(status),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Communautés"
        subtitle="Validez ou refusez les communautés créées par les utilisateurs"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageCommunity?status=${t.key}`}
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {communities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">💬</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              Aucune communauté dans cette catégorie
            </h3>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {communities.map((c) => {
              const meta = STATUS_META[c.status] || STATUS_META.pending;
              return (
                <li key={c._id} className="p-5 transition hover:bg-gray-50/60">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {CATEGORY_LABEL[c.category] || "Autre"}
                        </span>
                        {!c.isPublic && (
                          <span className="text-xs text-gray-500">Privée</span>
                        )}
                      </div>

                      <h3 className="mt-2 font-semibold text-gray-900">
                        <Link
                          href={`/users/communaute/${c._id}`}
                          className="hover:text-emerald-700 hover:underline"
                        >
                          {c.name}
                        </Link>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {c.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>
                          Par{" "}
                          <strong className="text-gray-700">
                            {c.creator?.name || "Inconnu"}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          {c.memberCount || 0} membre
                          {c.memberCount > 1 ? "s" : ""}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {c.rejectionReason && c.status === "rejected" && (
                        <p className="mt-1 text-xs italic text-red-500">
                          Motif : {c.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <CommunityReview
                        community={{
                          _id: c._id.toString(),
                          name: c.name,
                          status: c.status,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {communities.length} communauté{communities.length > 1 ? "s" : ""} affichée
        {communities.length > 1 ? "s" : ""} (limite 100)
      </p>
    </div>
  );
}