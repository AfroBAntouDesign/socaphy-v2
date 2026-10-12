// src/app/association/members/[id]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft, FaUser, FaIdCard, FaGraduationCap, FaBriefcase,
  FaFileAlt, FaCheckCircle, FaUserShield, FaDownload,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Cv from "@/models/Cv";
import Article from "@/models/Article";
import { ROLE_LABELS } from "@/lib/roles";
import CvViewer from "@/components/cv/CvViewer";

/* ------------------------------------------------------------------ */

const PUBLIC_ROLES = ["adminSOCAphy", "superAdmin"];

async function getMember(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return User.findOne({
    _id: id,
    role: { $in: PUBLIC_ROLES },
    status: "active",
  })
    .select("name avatar role profession description biography expertise parcours createdAt")
    .lean();
}

async function getLatestCv(userId) {
  await connectDB();
  return Cv.findOne({ user: userId, status: "approved" })
    .sort({ reviewedAt: -1 })
    .lean();
}

async function getArticleCounts(userId) {
  await connectDB();
  const mongoose = (await import("mongoose")).default;
  const rows = await Article.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: "validated",
      },
    },
    { $count: "count" },
  ]);
  return rows[0]?.count || 0;
}

async function getRecentArticles(userId, limit = 5) {
  await connectDB();
  return Article.find({ user: userId, status: "validated" })
    .sort({ validatedAt: -1 })
    .limit(limit)
    .select("title kind validatedAt slug")
    .lean();
}

/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) return { title: "Membre introuvable | SOCAphy" };

  return {
    title: `${member.name} | SOCAphy`,
    description:
      member.description ||
      `${ROLE_LABELS[member.role] || member.role} de la SOCAphy`,
  };
}

export default async function MemberPublicPage({ params }) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const isAuthorRole = [
    "adminSOCAphy",
    "scientifique",
    "clinic",
    "praticienSante",
    "tradiPraticien",
  ].includes(member.role);

  const [latestCv, articleCount, recentArticles] = await Promise.all([
    getLatestCv(member._id),
    isAuthorRole ? getArticleCounts(member._id) : 0,
    isAuthorRole ? getRecentArticles(member._id) : [],
  ]);

  const isSuperAdmin = member.role === "superAdmin";

  return (
    <div className="bg-gray-50">
      {/* Back link */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/association"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <FaArrowLeft /> Retour à l'association
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800" />

          <div className="px-6 pb-6 sm:px-8">
            {/* Avatar overlapping */}
            <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
                {member.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/90">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>

              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {member.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                      isSuperAdmin
                        ? "bg-orange-50 text-orange-700 ring-orange-200"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    }`}
                  >
                    {isSuperAdmin ? <FaUserShield /> : <FaUser />}
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </div>

                {member.profession && (
                  <p className="mt-1 text-sm text-gray-600 sm:text-base">
                    {member.profession}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {member.description && (
              <p className="mt-6 text-sm leading-relaxed text-gray-700 sm:text-base">
                {member.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Biography */}
            {member.biography && (
              <Section icon={FaUser} title="Biographie">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {member.biography}
                </p>
              </Section>
            )}

            {/* Expertise */}
            {member.expertise?.length > 0 && (
              <Section icon={FaBriefcase} title="Expertises">
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((e, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Parcours */}
            {member.parcours?.length > 0 && (
              <Section icon={FaGraduationCap} title="Parcours">
                <ul className="space-y-3">
                  {member.parcours.map((p, i) => (
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
              </Section>
            )}

            {/* Published articles */}
            {isAuthorRole && articleCount > 0 && (
              <Section
                icon={FaFileAlt}
                title={`Articles publiés (${articleCount})`}
                action={{ href: "/publicSpace", label: "Voir la place publique →" }}
              >
                {recentArticles.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun article.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentArticles.map((a) => (
                      <li
                        key={a._id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {a.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {a.kind === "scientific"
                              ? "Scientifique"
                              : "Pratique"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">
                          {new Date(
                            a.validatedAt || a.updatedAt
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4">
            {/* CV card */}
            {latestCv ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FaIdCard className="text-emerald-700" />
                  <h3 className="text-sm font-semibold text-emerald-900">
                    CV validé
                  </h3>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {latestCv.heading}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {latestCv.fileType?.toUpperCase()} ·{" "}
                    {(latestCv.fileSize / 1024).toFixed(0)} Ko
                  </p>
                </div>

                {/* Actions — CV viewer + download */}
                <div className="mt-3 flex flex-col gap-2">
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
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <FaIdCard /> Lire le CV
                    </button>
                  </CvViewer>

                  <a
                    href={latestCv.fileUrl}
                    download={latestCv.fileName}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <FaDownload /> Télécharger
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                <FaIdCard className="mx-auto text-2xl text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Aucun CV public disponible
                </p>
              </div>
            )}

            {/* Stats */}
            {isAuthorRole && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Contributions
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FaFileAlt className="text-lg" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {articleCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      article{articleCount > 1 ? "s" : ""} publié
                      {articleCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verified badge */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <FaCheckCircle className="mx-auto text-2xl text-emerald-600" />
              <p className="mt-2 text-xs font-medium text-emerald-800">
                Membre vérifié
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Depuis{" "}
                {new Date(member.createdAt).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Section({ icon: Icon, title, action, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="text-emerald-600" />
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}