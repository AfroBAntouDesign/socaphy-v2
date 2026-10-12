// src/app/cjp/page.js
import Link from "next/link";
import { FaArrowRight, FaPenNib, FaUsers, FaClipboardList } from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import JournalArticle from "@/models/JournalArticle";
import JournalIssue from "@/models/JournalIssue";
import Masthead from "@/components/cjp/Masthead";
import { SECTION_LABELS } from "@/lib/cjp";

/* ------------------------------------------------------------------ */

async function getJournalInfo() {
  await connectDB();
  return JournalInfo.findOne({ _key: "singleton" }).lean();
}

async function getLatestArticles(limit = 6) {
  await connectDB();
  return JournalArticle.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select("cjpId title titleEN authors section language publishedAt abstractFR abstractEN pages issue")
    .populate("issue", "volume number year slug")
    .lean();
}

async function getCurrentIssue() {
  await connectDB();
  return JournalIssue.findOne({ status: "current" }).lean();
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Accueil",
};

export default async function CjpHomePage() {
  const [info, articles, currentIssue] = await Promise.all([
    getJournalInfo(),
    getLatestArticles(6),
    getCurrentIssue(),
  ]);

  return (
    <div>
      <Masthead info={info} />

      {/* Hero — Appel à contributions */}
      <section className="border-b border-gray-200 bg-gradient-to-br from-emerald-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Appel à contributions
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-gray-900 sm:text-3xl">
                Soumettez vos travaux au CJP
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-700">
                Le Cameroonian Journal of Phytotherapae accueille les
                recherches originales, revues, études de cas et communications
                courtes portant sur tous les aspects scientifiques de la
                phytothérapie. Publication en accès libre et gratuite.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/cjp/submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <FaPenNib /> Soumettre un article
                </Link>
                <Link
                  href="/cjp/instructions"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <FaClipboardList /> Instructions aux auteurs
                </Link>
              </div>
            </div>

            {/* Current issue card */}
            {currentIssue && (
              <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Numéro en cours
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-gray-900">
                  Vol. {currentIssue.volume}, No. {currentIssue.number}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {currentIssue.year}
                  {currentIssue.title && ` — ${currentIssue.title}`}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {currentIssue.articleCount || 0} article
                  {(currentIssue.articleCount || 0) > 1 ? "s" : ""}
                </p>
                <Link
                  href={`/cjp/issues/${currentIssue.volume}/${currentIssue.number}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Voir le sommaire <FaArrowRight className="text-xs" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest articles */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900">
              Derniers articles
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Publications récentes du journal
            </p>
          </div>
          <Link
            href="/cjp/articles"
            className="hidden text-sm font-medium text-emerald-700 hover:underline sm:inline"
          >
            Tous les articles →
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-4xl">📖</p>
            <p className="mt-3 font-medium text-gray-800">
              Aucun article publié pour le moment
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Les premiers articles apparaîtront ici après publication.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {articles.map((a) => (
              <ArticleCard key={a._id} article={{ ...a, _id: a._id.toString() }} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/cjp/articles"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Tous les articles →
          </Link>
        </div>
      </section>

      {/* About strip */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Le journal
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {(info?.descriptionFR || "").slice(0, 220)}…
              </p>
              <Link
                href="/cjp/about"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                En savoir plus <FaArrowRight className="text-xs" />
              </Link>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Comité éditorial
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Le journal est dirigé par un comité scientifique international
                garantissant la rigueur et la qualité des publications.
              </p>
              <Link
                href="/cjp/editorial-board"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Voir le comité <FaUsers className="text-xs" />
              </Link>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Contact
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                {info?.contactEmail && <li>{info.contactEmail}</li>}
                {info?.contactCity && (
                  <li>
                    {info.contactCity}
                    {info.contactCountry && `, ${info.contactCountry}`}
                  </li>
                )}
                {info?.publisher && (
                  <li className="text-xs text-gray-500">{info.publisher}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ArticleCard({ article }) {
  const title = article.title;
  const abstract = article.abstractFR || article.abstractEN || "";
  const excerpt = abstract.length > 200 ? abstract.slice(0, 200).trim() + "…" : abstract;

  return (
    <Link
      href={`/cjp/articles/${article._id}`}
      className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          {SECTION_LABELS[article.section] || article.section}
        </span>
        {article.cjpId && (
          <span className="font-mono text-xs text-gray-400">
            {article.cjpId}
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-bold leading-snug text-gray-900 group-hover:text-emerald-800">
        {title}
      </h3>

      {article.authors?.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          {article.authors
            .slice(0, 3)
            .map((a) => a.name)
            .join(", ")}
          {article.authors.length > 3 && ` et al.`}
        </p>
      )}

      {excerpt && (
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
          {excerpt}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
        {article.issue && (
          <span>
            Vol. {article.issue.volume}, No. {article.issue.number}
          </span>
        )}
      </div>
    </Link>
  );
}
