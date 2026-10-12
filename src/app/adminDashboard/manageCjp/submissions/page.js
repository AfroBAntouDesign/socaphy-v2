// src/app/adminDashboard/manageCjp/submissions/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaFileAlt, FaUser, FaBook,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import JournalIssue from "@/models/JournalIssue";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import SubmissionActions from "./SubmissionActions";
import { ARTICLE_STATUS, SECTION_LABELS } from "@/lib/cjp";

const TABS = [
  { key: "submitted", label: "Soumis" },
  { key: "accepted", label: "Acceptés" },
  { key: "published", label: "Publiés" },
  { key: "rejected", label: "Refusés" },
  { key: "draft", label: "Brouillons" },
  { key: "all", label: "Tous" },
];

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await JournalArticle.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listArticles(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return JournalArticle.find(query)
    .sort({ submittedAt: -1, updatedAt: -1 })
    .limit(100)
    .populate("submittedBy", "name email role")
    .populate("issue", "volume number year")
    .select("cjpId title section status language authors submittedBy submittedAt publishedAt rejectionReason issue")
    .lean();
}

async function listIssues() {
  await connectDB();
  return JournalIssue.find({ status: { $in: ["current", "upcoming"] } })
    .sort({ volume: -1, number: -1 })
    .select("_id volume number year status")
    .lean();
}

export const metadata = {
  title: "Soumissions | Admin CJP",
};

export default async function ManageCjpSubmissionsPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "submitted";

  const [counts, articles, issues] = await Promise.all([
    countByStatus(),
    listArticles(status),
    listIssues(),
  ]);

  const issuesSerialized = issues.map((i) => ({
    _id: i._id.toString(),
    volume: i.volume,
    number: i.number,
    year: i.year,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/adminDashboard/manageCjp"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        ← Journal CJP
      </Link>

      <AdminHeader
        title="Soumissions"
        subtitle="Validez, publiez ou refusez les articles du journal"
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageCjp/submissions?status=${t.key}`}
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

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📭</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              Aucun article dans cette catégorie
            </h3>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.map((a) => {
              const meta = ARTICLE_STATUS[a.status] || ARTICLE_STATUS.draft;
              const authorList = (a.authors || []).slice(0, 3).map((x) => x.name).join(", ");
              return (
                <li key={a._id.toString()} className="p-5 transition hover:bg-gray-50/60">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}>
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {SECTION_LABELS[a.section] || a.section}
                        </span>
                        {a.cjpId && (
                          <span className="font-mono text-xs text-gray-400">
                            {a.cjpId}
                          </span>
                        )}
                        {a.language === "bilingual" && (
                          <span className="text-xs text-gray-400">FR · EN</span>
                        )}
                      </div>

                      <h3 className="mt-2 font-serif text-base font-bold text-gray-900">
                        {a.title}
                      </h3>

                      {authorList && (
                        <p className="mt-1 text-xs text-gray-600">
                          <FaUser className="mr-1 inline text-[10px]" />
                          {authorList}
                          {a.authors?.length > 3 && " et al."}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>
                          Soumis par{" "}
                          <strong className="text-gray-700">
                            {a.submittedBy?.name || "—"}
                          </strong>{" "}
                          ({ROLE_LABELS[a.submittedBy?.role] || a.submittedBy?.role || "—"})
                        </span>
                        {a.submittedAt && (
                          <>
                            <span>·</span>
                            <span>
                              {new Date(a.submittedAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        )}
                        {a.issue && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <FaBook className="text-[10px]" />
                              Vol. {a.issue.volume}, No. {a.issue.number}
                            </span>
                          </>
                        )}
                      </div>

                      {a.rejectionReason && a.status === "rejected" && (
                        <p className="mt-1 text-xs italic text-red-500">
                          Motif : {a.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <SubmissionActions
                        article={{
                          _id: a._id.toString(),
                          title: a.title,
                          status: a.status,
                        }}
                        issues={issuesSerialized}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
