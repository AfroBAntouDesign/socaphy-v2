// src/app/users/scientifique/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaPlus,
  FaFileAlt,
  FaEdit,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaUsers,
  FaStore,
  FaGlobe,
  FaLightbulb,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getDashboardData(userId) {
  await connectDB();
  const [user, counts, recent] = await Promise.all([
    User.findById(userId).select("name email avatar biography expertise").lean(),
    Article.aggregate([
      { $match: { user: new (await import("mongoose")).default.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Article.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status kind updatedAt rejectionReason")
      .lean(),
  ]);

  const stats = { total: 0, draft: 0, submitted: 0, validated: 0, rejected: 0 };
  for (const c of counts) {
    stats[c._id] = c.count;
    stats.total += c.count;
  }

  return { user, stats, recent };
}

const STATUS_META = {
  draft: { label: "Brouillon", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  submitted: { label: "Soumis", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  validated: { label: "Validé", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Refusé", pill: "bg-red-50 text-red-700 ring-red-200" },
  archived: { label: "Archivé", pill: "bg-gray-100 text-gray-600 ring-gray-200" },
};

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Tableau de bord Scientifique | SOCAphy",
};

export default async function ScientifiqueDashboard() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/scientifique");
  if (session.role !== "scientifique") redirect("/");

  const { user, stats, recent } = await getDashboardData(session.sub);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Espace Scientifique
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Bonjour, {user?.name?.split(" ")[0] || "chercheur"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Publiez vos travaux, suivez leur validation et échangez avec la communauté.
        </p>
      </header>

      {/* ── Primary action ── */}
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Soumettre un article scientifique</h2>
            <p className="mt-1 max-w-xl text-sm text-emerald-50">
              Partagez vos recherches sur les plantes médicinales, protocoles
              thérapeutiques ou pratiques ancestrales validées.
            </p>
          </div>
          <Link
            href="/users/scientifique/nouveau"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            <FaPlus /> Nouvel article
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Mes statistiques
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={FaFileAlt} tone="emerald" />
          <StatCard label="Brouillons" value={stats.draft} icon={FaEdit} tone="gray" />
          <StatCard label="Soumis" value={stats.submitted} icon={FaPaperPlane} tone="orange" />
          <StatCard label="Validés" value={stats.validated} icon={FaCheckCircle} tone="emerald" />
          <StatCard label="Refusés" value={stats.rejected} icon={FaTimesCircle} tone="red" />
        </div>
      </section>

      {/* ── Two columns ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent articles */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Activité récente
            </h2>
            <Link
              href="/users/scientifique/articles"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              Tout voir →
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {recent.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl">📝</p>
                <p className="mt-2 font-medium text-gray-900">
                  Aucun article pour le moment
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre premier brouillon.
                </p>
                <Link
                  href="/users/scientifique/nouveau"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <FaPlus /> Créer un article
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recent.map((a) => {
                  const meta = STATUS_META[a.status] || STATUS_META.draft;
                  return (
                    <li key={a._id}>
                      <Link
                        href={`/users/scientifique/articles/${a._id}`}
                        className="flex items-start justify-between gap-4 p-4 transition hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Modifié le{" "}
                            {new Date(a.updatedAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {a.rejectionReason && a.status === "rejected" && (
                            <p className="mt-1 truncate text-xs italic text-red-500">
                              Motif : {a.rejectionReason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Quick links + tips */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Raccourcis
            </h3>
            <ul className="space-y-2">
              <QuickLink href="/users/communaute" icon={FaUsers} label="Communauté SOCAphy" />
              <QuickLink href="/market" icon={FaStore} label="Marché aux produits" />
              <QuickLink href="/publicSpace" icon={FaGlobe} label="Articles publics" />
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <FaLightbulb className="text-emerald-700" />
              <h3 className="text-sm font-semibold text-emerald-900">
                Conseil
              </h3>
            </div>
            <p className="text-sm text-emerald-800">
              Un article bien structuré (résumé clair, méthodologie détaillée,
              références vérifiables) est validé plus rapidement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
    red: "bg-red-50 text-red-800 ring-red-100",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide opacity-75">
          {label}
        </p>
        <Icon className="opacity-50" aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
      >
        <Icon className="text-emerald-600" aria-hidden />
        {label}
      </Link>
    </li>
  );
}