// src/app/adminDashboard/manageCv/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaFileAlt, FaEye } from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import CvReview from "./CvReview";

const TABS = [
  { key: "submitted", label: "En attente" },
  { key: "approved", label: "Approuvés" },
  { key: "rejected", label: "Refusés" },
  { key: "all", label: "Tous" },
];

const STATUS_PILL = {
  submitted: "bg-orange-50 text-orange-700 ring-orange-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

const STATUS_LABEL = {
  submitted: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function countByStatus() {
  await connectDB();
  const rows = await Cv.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { all: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listCvs(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return Cv.find(query)
    .sort({ submittedAt: -1 })
    .limit(100)
    .populate("user", "name email role")
    .lean();
}

export const metadata = {
  title: "CV | Admin SOCAphy",
};

export default async function ManageCvPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = TABS.some((t) => t.key === params?.status)
    ? params.status
    : "submitted";

  const [counts, cvs] = await Promise.all([
    countByStatus(),
    listCvs(status),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Validation des CV"
        subtitle="Approuvez ou refusez les dossiers des professionnels"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageCv?status=${t.key}`}
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
        {cvs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📄</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              Aucun CV dans cette catégorie
            </h3>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {cvs.map((cv) => (
              <li key={cv._id} className="p-5 transition hover:bg-gray-50/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          STATUS_PILL[cv.status] || STATUS_PILL.submitted
                        }`}
                      >
                        {STATUS_LABEL[cv.status] || cv.status}
                      </span>
                      {cv.user?.role && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {ROLE_LABELS[cv.user.role] || cv.user.role}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-semibold text-gray-900">
                      <Link
                        href={`/adminDashboard/manageCv/${cv._id}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {cv.heading}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-700">
                      {cv.fullName}
                      {cv.profession && ` · ${cv.profession}`}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>
                        Soumis par{" "}
                        <strong className="text-gray-700">
                          {cv.user?.name || "Inconnu"}
                        </strong>{" "}
                        ({cv.user?.email})
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <FaFileAlt /> {cv.fileName}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(cv.submittedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Link
                      href={`/adminDashboard/manageCv/${cv._id}`}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <FaEye /> Lire
                    </Link>
                    <CvReview
                      cv={{
                        _id: cv._id.toString(),
                        heading: cv.heading,
                        status: cv.status,
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
        {cvs.length} CV affiché{cvs.length > 1 ? "s" : ""} (limite 100)
      </p>
    </div>
  );
}