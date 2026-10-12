// src/app/adminDashboard/manageArticles/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import ArticleReview from "./ArticleReview";

/* ------------------------------------------------------------------ */

const TABS = [
  { key: "submitted", label: "À valider" },
  { key: "validated", label: "Validés" },
  { key: "rejected", label: "Refusés" },
  { key: "draft", label: "Brouillons" },
  { key: "all", label: "Tous" },
];

const STATUS_PILL = {
  draft: "bg-gray-100 text-gray-700 ring-gray-200",
  submitted: "bg-orange-50 text-orange-700 ring-orange-200",
  validated: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  archived: "bg-gray-100 text-gray-600 ring-gray-200",
};

const STATUS_LABEL = {
  draft: "Brouillon",
  submitted: "En attente",
  validated: "Validé",
  rejected: "Refusé",
  archived: "Archivé",
};

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus(authorId) {
  await connectDB();
  const pipeline = [];
  if (authorId && /^[a-f\d]{24}$/i.test(authorId)) {
    const mongoose = (await import("mongoose")).default;
    pipeline.push({ $match: { user: new mongoose.Types.ObjectId(authorId) } });
  }
  pipeline.push({ $group: { _id: "$status", count: { $sum: 1 } } });

  const rows = await Article.aggregate(pipeline);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listArticles(status, authorId) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  if (authorId && /^[a-f\d]{24}$/i.test(authorId)) {
    query.user = authorId;
  }
  return Article.find(query)
    .sort({ submittedAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("user", "name email role")
    .select(
      "title kind status profileType abstract description user attachments createdAt updatedAt submittedAt"
    )
    .lean();
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Articles | Admin SOCAphy",
};

export default async function ManageArticlesPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "submitted";
  const authorId = params?.author || null;

  const [counts, articles] = await Promise.all([
    countByStatus(authorId),
    listArticles(status, authorId),
  ]);

  const buildHref = (key) => {
    const qs = new URLSearchParams();
    qs.set("status", key);
    if (authorId) qs.set("author", authorId);
    return `/adminDashboard/manageArticles?${qs.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Gestion des articles"
        subtitle="Validez ou refusez les articles soumis par les scientifiques et praticiens"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {authorId && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Filtre actif : articles d'un auteur spécifique.{" "}
          <Link
            href="/adminDashboard/manageArticles"
            className="font-semibold underline"
          >
            Retirer le filtre
          </Link>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={buildHref(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📭</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              Aucun article dans cette catégorie
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Changez de filtre ou attendez de nouvelles soumissions.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.map((a) => (
              <li key={a._id} className="p-5 transition hover:bg-gray-50/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          STATUS_PILL[a.status] || STATUS_PILL.draft
                        }`}
                      >
                        {STATUS_LABEL[a.status] || a.status}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {a.kind === "scientific" ? "Scientifique" : "Pratique"}
                      </span>
                      {a.attachments?.length > 0 && (
                        <span className="text-xs text-gray-500">
                          📎 {a.attachments.length} pièce
                          {a.attachments.length > 1 ? "s" : ""} jointe
                          {a.attachments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-semibold text-gray-900">
                      {a.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {a.abstract || a.description || "—"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>
                        Par{" "}
                        <strong className="text-gray-700">
                          {a.user?.name || "Inconnu"}
                        </strong>{" "}
                        ({ROLE_LABELS[a.user?.role] || a.user?.role || "—"})
                      </span>
                      <span>·</span>
                      <span>
                        Soumis le{" "}
                        {new Date(
                          a.submittedAt || a.updatedAt
                        ).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <ArticleReview
                      article={{
                        _id: a._id.toString(),
                        title: a.title,
                        status: a.status,
                        abstract: a.abstract,
                        description: a.description,
                        kind: a.kind,
                        attachments: (a.attachments || []).map((att) => ({
                          fileUrl: att.fileUrl,
                          originalName: att.originalName,
                          type: att.type,
                          size: att.size,
                        })),
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        {articles.length} article{articles.length > 1 ? "s" : ""} affiché
        {articles.length > 1 ? "s" : ""} (limite 100)
      </p>
    </div>
  );
}