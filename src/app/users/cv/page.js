// src/app/users/cv/page.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaCheckCircle, FaClock, FaTimesCircle,
  FaFileAlt, FaEye,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import CvSubmitForm from "@/components/cv/CvSubmitForm";
import CvViewer from "@/components/cv/CvViewer";
import CvDeleteButton from "./CvDeleteButton";

const CV_ROLES = ["scientifique", "praticienSante", "clinic", "tradiPraticien"];

const STATUS_META = {
  submitted: {
    label: "En attente de validation",
    icon: FaClock,
    pill: "bg-orange-50 text-orange-700 ring-orange-200",
    desc: "Votre CV est en cours d'examen par le comité scientifique.",
  },
  approved: {
    label: "Approuvé",
    icon: FaCheckCircle,
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    desc: "Votre CV a été validé par le comité scientifique SOCAphy.",
  },
  rejected: {
    label: "Refusé",
    icon: FaTimesCircle,
    pill: "bg-red-50 text-red-700 ring-red-200",
    desc: "Votre CV n'a pas été retenu. Vous pouvez soumettre une nouvelle version.",
  },
};

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Mon CV | SOCAphy",
};

export default async function MyCvPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/cv");
  if (!CV_ROLES.includes(session.role)) redirect("/users/profile");

  await connectDB();
  const cvs = await Cv.find({ user: session.sub })
    .sort({ submittedAt: -1 })
    .lean();

  const activeCv = cvs.find(
    (c) => c.status === "submitted" || c.status === "approved"
  );
  const canSubmit = !activeCv;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/profile"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Mon profil
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Mon CV
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Soumettez votre curriculum vitae pour validation par le comité
        scientifique de la SOCAphy.
      </p>

      {/* Active CV display */}
      {activeCv && (
        <div className="mt-8 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-gray-900">
                  {activeCv.heading}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {activeCv.fullName}
                  {activeCv.profession && ` · ${activeCv.profession}`}
                </p>
              </div>
              {(() => {
                const meta = STATUS_META[activeCv.status];
                const Icon = meta.icon;
                return (
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${meta.pill}`}
                  >
                    <Icon /> {meta.label}
                  </span>
                );
              })()}
            </div>

            <p className="text-sm text-gray-600">{STATUS_META[activeCv.status].desc}</p>

            {activeCv.status === "rejected" && activeCv.rejectionReason && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-800">
                  Motif du refus
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {activeCv.rejectionReason}
                </p>
              </div>
            )}

            {activeCv.summary && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Résumé
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {activeCv.summary}
                </p>
              </div>
            )}

            {/* File with viewer */}
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FaFileAlt className="shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {activeCv.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeCv.fileType.toUpperCase()} ·{" "}
                    {(activeCv.fileSize / 1024).toFixed(0)} Ko
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <CvViewer
                  cv={{
                    fileUrl: activeCv.fileUrl,
                    fileName: activeCv.fileName,
                    fileType: activeCv.fileType,
                    fileSize: activeCv.fileSize,
                  }}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <FaEye /> Lire le CV
                  </button>
                </CvViewer>
              </div>
            </div>

            {activeCv.status === "submitted" && (
              <div className="mt-4 flex justify-end">
                <CvDeleteButton cvId={activeCv._id.toString()} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission form */}
      {canSubmit && (
        <div className="mt-8">
          {cvs.length > 0 && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              Vous pouvez soumettre une nouvelle version de votre CV.
            </div>
          )}
          <h2 className="mb-4 font-semibold text-gray-900">Nouvelle soumission</h2>
          <CvSubmitForm />
        </div>
      )}
    </div>
  );
}