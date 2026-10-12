// src/app/adminDashboard/manageCv/[id]/page.js
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  FaFileAlt, FaEye, FaDownload, FaUser, FaEnvelope,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import CvViewer from "@/components/cv/CvViewer";
import CvReview from "../CvReview";

const STATUS_META = {
  submitted: { label: "En attente", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  approved: { label: "Approuvé", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Refusé", pill: "bg-red-50 text-red-700 ring-red-200" },
};

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getCv(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return Cv.findById(id).populate("user", "name email role avatar").lean();
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cv = await getCv(id);
  return { title: cv ? `${cv.heading} | Admin SOCAphy` : "CV" };
}

export default async function CvDetailPage({ params }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const { id } = await params;
  const cv = await getCv(id);
  if (!cv) notFound();

  const meta = STATUS_META[cv.status] || STATUS_META.submitted;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title={cv.heading}
        subtitle={`Soumis par ${cv.user?.name || "—"}`}
        action={{ href: "/adminDashboard/manageCv", label: "← Tous les CV" }}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${meta.pill}`}>
          {meta.label}
        </span>
        {cv.user?.role && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {ROLE_LABELS[cv.user.role] || cv.user.role}
          </span>
        )}
      </div>

      {cv.status === "rejected" && cv.rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">Motif du refus</p>
          <p className="mt-1 text-sm text-red-700">{cv.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Informations
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Nom complet" value={cv.fullName} />
              <InfoRow label="Profession" value={cv.profession || "—"} />
              <InfoRow
                label="Soumis le"
                value={new Date(cv.submittedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
              <InfoRow label="Statut" value={meta.label} />
            </dl>
          </section>

          {/* Summary */}
          {cv.summary && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Résumé du parcours
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {cv.summary}
              </p>
            </section>
          )}

          {/* File card with viewer */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Fichier CV
            </h2>
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FaFileAlt className="shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {cv.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cv.fileType.toUpperCase()} · {(cv.fileSize / 1024).toFixed(0)} Ko
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <CvViewer
                  cv={{
                    fileUrl: cv.fileUrl,
                    fileName: cv.fileName,
                    fileType: cv.fileType,
                    fileSize: cv.fileSize,
                  }}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <FaEye /> Lire le CV
                  </button>
                </CvViewer>

                <a
                  href={cv.fileUrl}
                  download={cv.fileName}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  <FaDownload /> Télécharger
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Candidat
            </h3>
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm text-gray-800">
                <FaUser className="text-gray-400" />
                {cv.user?.name || "—"}
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                <FaEnvelope className="text-gray-400" />
                <span className="truncate">{cv.user?.email || "—"}</span>
              </p>
              {cv.user?._id && (
                <Link
                  href={`/adminDashboard/manageUsers/${cv.user._id}`}
                  className="mt-2 block text-xs font-medium text-emerald-700 hover:underline"
                >
                  Voir le profil complet →
                </Link>
              )}
            </div>
          </div>

          {cv.status === "submitted" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </h3>
              <CvReview
                cv={{
                  _id: cv._id.toString(),
                  heading: cv.heading,
                  status: cv.status,
                }}
              />
            </div>
          )}

          {cv.reviewedAt && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Décision
              </h3>
              <p className="text-sm text-gray-700">
                {meta.label} le{" "}
                {new Date(cv.reviewedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}