// src/app/cjp/articles/page.js
import Link from "next/link";
import { FaSearch, FaBookOpen } from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import JournalArticle from "@/models/JournalArticle";
import JournalIssue from "@/models/JournalIssue";
import Masthead from "@/components/cjp/Masthead";
import { ARTICLE_SECTIONS, SECTION_LABELS } from "@/lib/cjp";

export const metadata = {
  title: "Articles publiés",
};

/* ------------------------------------------------------------------ */

async function listArticles({ q, section, issueId }) {
  await connectDB();
  const query = { status: "published" };
  if (section && section !== "all") query.section = section;
  if (issueId) query.issue = issueId;
  if (q) query.$text = { $search: q };

  return JournalArticle.find(query)
    .sort({ publishedAt: -1 })
    .limit(60)
    .select("cjpId title titleEN authors section language publishedAt abstractFR abstractEN pages issue")
    .populate("issue", "volume number year slug")
    .lean();
}

async function listIssues() {
  await connectDB();
  return JournalIssue.find({ status: { $in: ["current", "archived"] } })
    .sort({ volume: -1, number: -1 })
    .limit(20)
    .lean();
}

/* ------------------------------------------------------------------ */

export default async function ArticlesListPage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const section = ARTICLE_SECTIONS.some((s) => s.value === params?.section)
    ? params.section
    : "all";
  const issueId = params?.issue || null;

  const [info, articles, issues] = await Promise.all([
    JournalInfo.findOne({ _key: "singleton" }).lean(),
    listArticles({ q, section, issueId }),
    listIssues(),
  ]);

  const buildHref = ({ sectionKey, issueKey } = {}) => {
    const p = new URLSearchParams();
    const s = sectionKey ?? section;
    const i = issueKey === null ? null : issueKey ?? issueId;
    if (s !== "all") p.set("section", s);
    if (i) p.set("issue", i);
    if (q) p.set("q", q);
    return `/cjp/articles${p.toString() ? "?" + p : ""}`;
  };

  return (
    <div>
      <Masthead info={info} compact />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            Articles publiés
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Toutes les publications du Cameroonian Journal of Phytotherapae.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref({ sectionKey: "all", issueKey: null })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                section === "all" && !issueId
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              Tous
            </Link>
            {ARTICLE_SECTIONS.map((s) => (
              <Link
                key={s.value}
                href={buildHref({ sectionKey: s.value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  section === s.value
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>

          <form method="GET" className="flex w-full items-center gap-2 lg:w-auto">
            {section !== "all" && <input type="hidden" name="section" value={section} />}
            {issueId && <input type="hidden" name="issue" value={issueId} />}
            <div className="relative flex-1 lg:w-72">
              <FaSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Rechercher un titre, un auteur…"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Chercher
            </button>
          </form>
        </div>

        {/* Issue filter chips */}
        {issues.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Numéros :
            </span>
            {issues.map((i) => (
              <Link
                key={i._id.toString()}
                href={buildHref({ issueKey: i._id.toString() })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  issueId === i._id.toString()
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Vol. {i.volume}, No. {i.number}
              </Link>
            ))}
          </div>
        )}

        {/* Results */}
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <p className="text-4xl">📖</p>
            <h3 className="mt-3 font-medium text-gray-800">
              {q ? "Aucun résultat" : "Aucun article publié"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {q
                ? "Essayez d'autres mots-clés."
                : "Les premiers articles apparaîtront ici après publication."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {articles.length} article{articles.length > 1 ? "s" : ""}
              {q && (
                <>
                  {" "}pour « <strong className="text-gray-700">{q}</strong> »
                </>
              )}
            </p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {articles.map((a) => (
                <ArticleCard key={a._id.toString()} article={{ ...a, _id: a._id.toString() }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }) {
  const abstract = article.abstractFR || article.abstractEN || "";
  const excerpt = abstract.length > 220 ? abstract.slice(0, 220).trim() + "…" : abstract;

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
          <span className="font-mono text-xs text-gray-400">{article.cjpId}</span>
        )}
        {article.language === "bilingual" && (
          <span className="text-xs text-gray-400">FR · EN</span>
        )}
      </div>

      <h3 className="font-serif text-lg font-bold leading-snug text-gray-900 group-hover:text-emerald-800">
        {article.title}
      </h3>

      {article.authors?.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          {article.authors.slice(0, 3).map((a) => a.name).join(", ")}
          {article.authors.length > 3 && " et al."}
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
