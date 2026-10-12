// src/app/adminDashboard/manageCjp/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaBook, FaInfoCircle, FaUsers, FaLayerGroup, FaFileAlt,
  FaFlag, FaArrowRight, FaCheckCircle, FaClock, FaTimesCircle,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import JournalIssue from "@/models/JournalIssue";
import JournalBoardMember from "@/models/JournalBoardMember";
import JournalReport from "@/models/JournalReport";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getStats() {
  await connectDB();

  const [
    totalArticles,
    submitted,
    accepted,
    published,
    rejected,
    boardMembers,
    issues,
    pendingReports,
  ] = await Promise.all([
    JournalArticle.countDocuments(),
    JournalArticle.countDocuments({ status: "submitted" }),
    JournalArticle.countDocuments({ status: "accepted" }),
    JournalArticle.countDocuments({ status: "published" }),
    JournalArticle.countDocuments({ status: "rejected" }),
    JournalBoardMember.countDocuments({ isActive: true }),
    JournalIssue.countDocuments(),
    JournalReport.countDocuments({ status: "pending" }),
  ]);

  return {
    totalArticles, submitted, accepted, published, rejected,
    boardMembers, issues, pendingReports,
  };
}

export const metadata = {
  title: "Journal CJP | Admin",
};

export default async function ManageCjpPage() {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const stats = await getStats();

  const SECTIONS = [
    {
      href: "/adminDashboard/manageCjp/info",
      label: "Informations du journal",
      desc: "Nom, ISSN, description, instructions",
      icon: FaInfoCircle,
      badge: null,
    },
    {
      href: "/adminDashboard/manageCjp/board",
      label: "Comité éditorial",
      desc: "Éditeurs et membres du comité",
      icon: FaUsers,
      badge: stats.boardMembers,
    },
    {
      href: "/adminDashboard/manageCjp/issues",
      label: "Volumes & numéros",
      desc: "Créer et gérer les numéros",
      icon: FaLayerGroup,
      badge: stats.issues,
    },
    {
      href: "/adminDashboard/manageCjp/submissions",
      label: "Soumissions",
      desc: "Valider, publier ou refuser",
      icon: FaFileAlt,
      badge: stats.submitted > 0 ? stats.submitted : null,
      highlight: stats.submitted > 0,
    },
    {
      href: "/adminDashboard/manageCjp/reports",
      label: "Signalements",
      desc: "Modérer le contenu signalé",
      icon: FaFlag,
      badge: stats.pendingReports > 0 ? stats.pendingReports : null,
      highlight: stats.pendingReports > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Cameroonian Journal of Phytotherapae"
        subtitle="Gestion du journal scientifique officiel de la SOCAphy"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {/* Quick stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Soumis" value={stats.submitted} tone="orange" icon={FaClock} />
        <StatCard label="Acceptés" value={stats.accepted} tone="blue" icon={FaCheckCircle} />
        <StatCard label="Publiés" value={stats.published} tone="emerald" icon={FaBook} />
        <StatCard label="Refusés" value={stats.rejected} tone="red" icon={FaTimesCircle} />
        <StatCard label="Membres" value={stats.boardMembers} tone="gray" icon={FaUsers} />
        <StatCard label="Signalements" value={stats.pendingReports} tone="red" icon={FaFlag} />
      </div>

      {/* Sections grid */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Modules du journal
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                s.highlight
                  ? "border-orange-300 ring-1 ring-orange-100"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <Icon className="text-lg" />
                </div>
                {s.badge !== null && s.badge !== undefined && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.highlight
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-800">
                {s.label}
              </h3>
              <p className="mt-1 flex-1 text-sm text-gray-600">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                Ouvrir <FaArrowRight className="text-[10px]" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
    red: "bg-red-50 text-red-800 ring-red-100",
    blue: "bg-blue-50 text-blue-800 ring-blue-100",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide opacity-75">
          {label}
        </p>
        {Icon && <Icon className="opacity-60" />}
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
