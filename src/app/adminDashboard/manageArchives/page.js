// src/app/adminDashboard/manageArchives/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaFileAlt, FaSearch, FaUser, FaCalendarCheck, FaPaperclip,
  FaCheckCircle, FaArchive,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import ArchiveActions from "./ArchiveActions";

/* ------------------------------------------------------------------ */

const TABS = [
  { key: "validated", label: "Validés" },
  { key: "archived", label: "Archivés" },
];

const KIND_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "scientific", label: "Scientifiques" },
  { key: "practical", label: "Pratiques" },
];

const KIND_LABEL = {
  scientific: "Scientifique",
  practical: "Pratique",
};

const KIND_PILL = {
  scientific: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  practical: "bg-orange-50 text-orange-700 ring-orange-100",
};

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await Article.aggregate([
    { $match: { status: { $in: ["validated", "archived"] } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { validated: 0, archived: 0 };
  for (const r of rows) counts[r._id] = r.count;
  return counts;
}

async function listArticles(status, kind, q) {
  await connectDB();

  const query = { status };
  if (kind !== "all") query.kind = kind;
  if (q) {
    // Uses the text index: title, abstract, description
    query.$text = { $search: q };
  }

  return Article.find(query)
    .sort({ validatedAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("user", "name role")
    .select(
      "title kind abstract description user attachments validatedAt updatedAt"
    )
    .lean();
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Archives médicales | Admin SOCAphy",
};

export default async function ManageArchivesPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "validated";
  const kind = KIND_FILTERS.some((k) => k.key === params?.kind)
    ? params.kind
    : "all";
  const q = (params?.q || "").trim();

  const [counts, articles] = await Promise.all([
    countByStatus(),
    listArticles(status, kind, q),
  ]);

  // Build URL helpers preserving filters
  const buildHref = ({ statusKey, kindKey } = {}) => {
    const p = new URLSearchParams();
    p.set("status", statusKey ?? status);
    p.set("kind", kindKey ?? kind);
    if (q) p.set("q", q);
    return `/adminDashboard/manageArchives?${p.toString()}`;
  };

  const isArchiveView = status === "archived";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Archives médicales"
        subtitle={
          isArchiveView
            ? "Articles validés retirés de la place publique"
            : "Base de référence des articles validés par le comité scientifique"
        }
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {/* Status tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          const Icon = t.key === "validated" ? FaCheckCircle : FaArchive;
          return (
            <Link
              key={t.key}
              href={buildHref({ statusKey: t.key })}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="text-xs" />
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

      {/* Filters row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Kind filter */}
        <div className="flex flex-wrap gap-2">
          {KIND_FILTERS.map((k) => {
            const active = kind === k.key;
            return (
              <Link
                key={k.key}
                href={buildHref({ kindKey: k.key })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {k.label}
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form
          method="GET"
          className="flex w-full items-center gap-2 sm:w-auto"
        >
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="kind" value={kind} />
          <div className="relative flex-1 sm:w-72">
            <FaSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un titre, une plante…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Chercher
          </button>
        </form>
      </div>

      {/* Search active banner */}
      {q && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Résultats pour « <strong>{q}</strong> » —{" "}
          <Link
            href={buildHref({ kindKey: kind })}
            className="font-semibold underline"
          >
            Effacer la recherche
          </Link>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">{isArchiveView ? "📦" : "✅"}</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              {q
                ? "Aucun résultat pour cette recherche"
                : isArchiveView
                ? "Aucun article archivé"
                : "Aucun article validé"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {q
                ? "Essayez d'autres mots-clés."
                : isArchiveView
                ? "Les articles archivés apparaîtront ici."
                : "Validez des articles depuis la gestion des articles."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.map((a) => (
              <li key={a._id} className="p-5 transition hover:bg-gray-50/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          isArchiveView
                            ? "bg-gray-100 text-gray-700 ring-gray-200"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        }`}
                      >
                        {isArchiveView ? "Archivé" : "Validé"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          KIND_PILL[a.kind] || KIND_PILL.scientific
                        }`}
                      >
                        {KIND_LABEL[a.kind] || a.kind}
                      </span>
                      {a.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <FaPaperclip className="text-[10px]" />
                          {a.attachments.length}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-2 font-semibold text-gray-900">
                      <a
                        href={`/publicSpace/${a._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {a.title}
                      </a>
                    </h3>

                    {/* Excerpt */}
                    {(a.abstract || a.description) && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {a.abstract || a.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <FaUser className="opacity-60" />
                        <strong className="text-gray-700">
                          {a.user?.name || "Inconnu"}
                        </strong>
                        {a.user?.role && (
                          <span>
                            · {ROLE_LABELS[a.user.role] || a.user.role}
                          </span>
                        )}
                      </span>
                      {a.validatedAt && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1.5">
                            <FaCalendarCheck className="opacity-60" />
                            Validé le{" "}
                            {new Date(a.validatedAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <ArchiveActions
                      article={{
                        _id: a._id.toString(),
                        title: a.title,
                      }}
                      variant={isArchiveView ? "unarchive" : "archive"}
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