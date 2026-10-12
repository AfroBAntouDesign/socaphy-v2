// src/app/adminDashboard/manageUsers/[id]/page.js
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  FaArrowLeft, FaUser, FaIdCard, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaCalendarAlt, FaCheckCircle, FaClock, FaBan, FaTimesCircle,
  FaFileAlt, FaGraduationCap, FaBriefcase, FaEdit,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Cv from "@/models/Cv";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import UserActions from "../UserActions";
import CvViewer from "@/components/cv/CvViewer";

/* ------------------------------------------------------------------ */

const STATUS_META = {
  active: { label: "Actif", icon: FaCheckCircle, pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending: { label: "En attente", icon: FaClock, pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  rejected: { label: "Refusé", icon: FaTimesCircle, pill: "bg-red-50 text-red-700 ring-red-200" },
  suspended: { label: "Suspendu", icon: FaBan, pill: "bg-gray-100 text-gray-700 ring-gray-300" },
};

const AUTHOR_ROLES = [
  "scientifique",
  "clinic",
  "praticienSante",
  "tradiPraticien",
  "adminSOCAphy",
];

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getUser(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return User.findById(id).select("-password").lean();
}

async function getLatestCv(userId) {
  await connectDB();
  return Cv.findOne({ user: userId, status: "approved" })
    .sort({ reviewedAt: -1 })
    .lean();
}

async function getRecentArticles(userId) {
  await connectDB();
  return Article.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select("title status kind updatedAt")
    .lean();
}

async function getArticleCounts(userId) {
  await connectDB();
  const mongoose = (await import("mongoose")).default;
  const rows = await Article.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = { total: 0, draft: 0, submitted: 0, validated: 0, rejected: 0 };
  for (const r of rows) {
    counts[r._id] = r.count;
    counts.total += r.count;
  }
  return counts;
}

/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }) {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user ? `${user.name} | Admin SOCAphy` : "Utilisateur" };
}

export default async function UserDetailPage({ params }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const isAuthor = AUTHOR_ROLES.includes(user.role);

  // Fetch CV + articles in parallel (articles only if author)
  const [latestCv, articlesData] = await Promise.all([
    getLatestCv(user._id),
    isAuthor
      ? Promise.all([getRecentArticles(user._id), getArticleCounts(user._id)])
      : Promise.resolve([[], { total: 0, draft: 0, submitted: 0, validated: 0, rejected: 0 }]),
  ]);

  const [recentArticles, articleCounts] = articlesData;

  const statusMeta = STATUS_META[user.status] || STATUS_META.active;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title={user.name}
        subtitle={user.email}
        action={{
          href: "/adminDashboard/manageUsers",
          label: "← Tous les utilisateurs",
        }}
      />

      {/* Status banner */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusMeta.pill}`}
        >
          <StatusIcon /> {statusMeta.label}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          {ROLE_LABELS[user.role] || user.role}
        </span>
        {user.verified && (
          <span className="text-xs text-gray-500">Compte vérifié</span>
        )}
      </div>

      {/* Rejection notice */}
      {user.rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Motif du refus</p>
          <p className="mt-1 text-sm text-red-700">{user.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact card */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Informations
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={FaUser} label="Nom complet" value={user.name} />
              <InfoRow icon={FaEnvelope} label="Email" value={user.email} />
              <InfoRow icon={FaPhone} label="Téléphone" value={user.phone || "—"} />
              <InfoRow
                icon={FaMapMarkerAlt}
                label="Adresse"
                value={user.address || "—"}
              />
              <InfoRow
                icon={FaCalendarAlt}
                label="Inscription"
                value={new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
              <InfoRow
                icon={FaClock}
                label="Dernière connexion"
                value={
                  user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais"
                }
              />
            </dl>
          </section>

          {/* Bio */}
          {(user.description || user.biography) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Présentation
              </h2>
              {user.description && (
                <p className="text-sm leading-relaxed text-gray-700">
                  {user.description}
                </p>
              )}
              {user.biography && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Biographie
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {user.biography}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Expertise */}
          {user.expertise?.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaBriefcase className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Expertises
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.expertise.map((e, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Parcours */}
          {user.parcours?.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FaGraduationCap className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Parcours académique / professionnel
                </h2>
              </div>
              <ul className="space-y-3">
                {user.parcours.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <p className="font-medium text-gray-900">
                      {p.institution || "—"}
                      {p.annee && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({p.annee})
                        </span>
                      )}
                    </p>
                    {p.mention && (
                      <p className="mt-1 text-xs text-gray-600">
                        Mention : {p.mention}
                      </p>
                    )}
                    {(p.dateDebut || p.dateFin) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {p.dateDebut &&
                          new Date(p.dateDebut).toLocaleDateString("fr-FR")}
                        {p.dateFin && (
                          <>
                            {" → "}
                            {new Date(p.dateFin).toLocaleDateString("fr-FR")}
                          </>
                        )}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CV */}
          {latestCv && (
            <section
              id="cv"
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    CV validé
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                  Approuvé
                </span>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{latestCv.heading}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {latestCv.fullName}
                  {latestCv.profession && ` · ${latestCv.profession}`}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <CvViewer
                    cv={{
                      fileUrl: latestCv.fileUrl,
                      fileName: latestCv.fileName,
                      fileType: latestCv.fileType,
                      fileSize: latestCv.fileSize,
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <FaIdCard /> Lire le CV
                    </button>
                  </CvViewer>

                  <a
                    href={latestCv.fileUrl}
                    download={latestCv.fileName}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Télécharger
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Articles (only for authors) */}
          {isAuthor && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaFileAlt className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Articles ({articleCounts.total})
                  </h2>
                </div>
                <Link
                  href={`/adminDashboard/manageArticles?author=${user._id}`}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Voir tous →
                </Link>
              </div>

              {articleCounts.total > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat
                    label="Brouillons"
                    value={articleCounts.draft || 0}
                    tone="gray"
                  />
                  <MiniStat
                    label="Soumis"
                    value={articleCounts.submitted || 0}
                    tone="orange"
                  />
                  <MiniStat
                    label="Validés"
                    value={articleCounts.validated || 0}
                    tone="emerald"
                  />
                  <MiniStat
                    label="Refusés"
                    value={articleCounts.rejected || 0}
                    tone="red"
                  />
                </div>
              )}

              {recentArticles.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun article.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentArticles.map((a) => (
                    <li
                      key={a._id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <p className="truncate text-sm text-gray-800">
                        {a.title}
                      </p>
                      <span className="shrink-0 text-xs text-gray-400">
                        {new Date(a.updatedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Right — Actions sidebar */}
        <aside className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-3xl font-bold text-white">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </h3>
            <UserActions
              user={{
                _id: user._id.toString(),
                name: user.name,
                status: user.status,
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon className="text-xs" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-gray-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-gray-900">{value}</dd>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    orange: "bg-orange-50 text-orange-800",
    red: "bg-red-50 text-red-800",
    gray: "bg-gray-50 text-gray-700",
  };
  return (
    <div className={`rounded-lg p-3 text-center ${tones[tone]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-75">
        {label}
      </p>
    </div>
  );
}