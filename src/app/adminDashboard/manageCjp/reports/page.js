// src/app/adminDashboard/manageCjp/reports/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaFlag, FaUser, FaBook } from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalReport from "@/models/JournalReport";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import ReportActions from "./ReportActions";
import { REPORT_REASONS, REPORT_STATUS } from "@/lib/cjp";

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "reviewed", label: "Examinés" },
  { key: "action_taken", label: "Action prise" },
  { key: "dismissed", label: "Rejetés" },
  { key: "all", label: "Tous" },
];

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await JournalReport.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listReports(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return JournalReport.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("reportedBy", "name email role")
    .populate("article", "cjpId title")
    .populate("comment", "content")
    .lean();
}

export const metadata = {
  title: "Signalements | Admin CJP",
};

function reasonLabelFor(value) {
  const found = REPORT_REASONS.find((x) => x.value === value);
  return found ? found.label : value;
}

export default async function ManageCjpReportsPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "pending";

  const [counts, reports] = await Promise.all([
    countByStatus(),
    listReports(status),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/adminDashboard/manageCjp"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        ← Journal CJP
      </Link>

      <AdminHeader
        title="Signalements"
        subtitle="Modérez les contenus signalés par les utilisateurs"
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageCjp/reports?status=${t.key}`}
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

      {/* Empty */}
      {reports.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">✅</p>
          <h3 className="mt-3 font-semibold text-gray-900">
            Aucun signalement dans cette catégorie
          </h3>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <ReportRow key={r._id.toString()} report={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportRow({ report }) {
  const meta = REPORT_STATUS[report.status] || REPORT_STATUS.pending;
  const reasonLabel = reasonLabelFor(report.reason);
  const articleId = report.article?._id?.toString();
  const articleTitle = report.article?.title;
  const articleCjpId = report.article?.cjpId;
  const commentContent = report.comment?.content;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}
            >
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
              <FaFlag className="text-[10px]" />
              {reasonLabel}
            </span>
          </div>

          {/* Article title */}
          {articleId && (
            <h3 className="mt-2 font-serif text-base font-bold text-gray-900">
              <Link
                href={`/cjp/articles/${articleId}`}
                target="_blank"
                className="inline-flex items-center gap-2 hover:text-emerald-700 hover:underline"
              >
                <FaBook className="text-xs" />
                {articleCjpId && (
                  <span className="font-mono text-xs text-gray-400">
                    {articleCjpId}
                  </span>
                )}
                {articleTitle}
              </Link>
            </h3>
          )}

          {/* Comment excerpt */}
          {commentContent && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Commentaire signalé
              </p>
              <p className="mt-1 line-clamp-3 text-gray-700">
                {commentContent}
              </p>
            </div>
          )}

          {/* Details */}
          {report.details && (
            <div className="mt-3 text-sm text-gray-700">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Détails :
              </span>{" "}
              {report.details}
            </div>
          )}

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <FaUser className="opacity-60" />
              Signalé par{" "}
              <strong className="text-gray-700">
                {report.reportedBy?.name || "—"}
              </strong>
            </span>
            <span>·</span>
            <span>
              {new Date(report.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {report.reviewedAt && (
              <>
                <span>·</span>
                <span>
                  Examiné le{" "}
                  {new Date(report.reviewedAt).toLocaleDateString("fr-FR")}
                </span>
              </>
            )}
          </div>

          {/* Notes */}
          {report.resolutionNote && (
            <p className="mt-1 text-xs italic text-gray-500">
              Note : {report.resolutionNote}
            </p>
          )}
          {report.actionTaken && (
            <p className="mt-1 text-xs italic text-emerald-700">
              Action : {report.actionTaken}
            </p>
          )}
        </div>

        {/* Actions */}
        {report.status === "pending" && (
          <div className="shrink-0">
            <ReportActions reportId={report._id.toString()} />
          </div>
        )}
      </div>
    </li>
  );
}
