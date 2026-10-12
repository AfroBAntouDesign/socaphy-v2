// src/app/users/cjp/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaPlus, FaBook, FaExternalLinkAlt } from "react-icons/fa";
import SubmissionActions from "./SubmissionActions";

import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ARTICLE_STATUS, SECTION_LABELS, canSubmitToJournal } from "@/lib/cjp";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Mes soumissions CJP",
};

export default async function MyCjpSubmissionsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/cjp");

  if (!canSubmitToJournal(session.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Accès restreint
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Votre rôle ne permet pas de soumettre au journal.
        </p>
      </div>
    );
  }

  await connectDB();
  const articles = await JournalArticle.find({ submittedBy: session.sub })
    .sort({ updatedAt: -1 })
    .select("cjpId title status section submittedAt publishedAt updatedAt rejectionReason")
    .lean();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <FaBook />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Journal CJP
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Mes soumissions
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {articles.length} article{articles.length > 1 ? "s" : ""} soumis
          </p>
        </div>

        <Link
          href="/cjp/submit"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaPlus /> Nouvelle soumission
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-4xl">📝</p>
          <p className="mt-3 font-medium text-gray-800">
            Aucune soumission pour le moment
          </p>
          <Link
            href="/cjp/submit"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <FaPlus /> Soumettre un article
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {articles.map((a) => {
              const meta = ARTICLE_STATUS[a.status] || ARTICLE_STATUS.draft;
              return (
                <li key={a._id.toString()} className="p-5 transition hover:bg-gray-50/60">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                      </div>
                      <h3 className="mt-2 font-serif text-base font-bold text-gray-900">
                        {a.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        Dernière mise à jour :{" "}
                        {new Date(a.updatedAt).toLocaleDateString("fr-FR")}
                      </p>
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
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
