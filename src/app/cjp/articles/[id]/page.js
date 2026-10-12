// src/app/cjp/articles/[id]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  FaArrowLeft, FaFilePdf, FaDownload, FaEye, FaPrint, FaQuoteLeft,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import JournalArticle from "@/models/JournalArticle";
import JournalIssue from "@/models/JournalIssue";
import JournalComment from "@/models/JournalComment";
import Masthead from "@/components/cjp/Masthead";
import CommentSection from "@/components/cjp/CommentSection";
import ReportButton from "@/components/cjp/ReportButton";
import { SECTION_LABELS } from "@/lib/cjp";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getArticle(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return JournalArticle.findOne({ _id: id, status: "published" })
    .populate("issue", "volume number year slug title")
    .lean();
}

async function getComments(articleId) {
  await connectDB();
  const comments = await JournalComment.find({
    article: articleId,
    status: "published",
  })
    .sort({ createdAt: 1 })
    .populate("author", "name role avatar")
    .lean();

  return comments.map((c) => ({
    _id: c._id.toString(),
    content: c.content,
    parent: c.parent?.toString() || null,
    createdAt: c.createdAt,
    author: {
      _id: c.author?._id?.toString(),
      name: c.author?.name || "Anonyme",
      role: c.author?.role,
      avatar: c.author?.avatar,
    },
  }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Article introuvable | CJP" };
  return {
    title: `${article.title} | CJP`,
    description: (article.abstractFR || article.abstractEN || "").slice(0, 160),
  };
}

export default async function JournalArticlePage({ params }) {
  const { id } = await params;
  const [article, session] = await Promise.all([getArticle(id), getSession()]);
  if (!article) notFound();

  const [info, comments] = await Promise.all([
    JournalInfo.findOne({ _key: "singleton" }).lean(),
    getComments(article._id),
  ]);

  // Increment view count (fire and forget)
  JournalArticle.updateOne({ _id: article._id }, { $inc: { views: 1 } }).catch(() => {});

  const pdf = article.attachments?.find((a) => a.type === "pdf");
  const otherAttachments = (article.attachments || []).filter((a) => a.type !== "pdf");

  const canComment = !!session && session.role !== "visiteur";

  return (
    <div>
      <Masthead info={info} compact />

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/cjp/articles"
          className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <FaArrowLeft /> Tous les articles
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {SECTION_LABELS[article.section] || article.section}
            </span>
            {article.cjpId && (
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                {article.cjpId}
              </span>
            )}
            {article.doi && (
              <span className="text-xs text-gray-500">DOI : {article.doi}</span>
            )}
          </div>

          <h1 className="font-serif text-2xl font-bold leading-tight text-gray-900 sm:text-3xl md:text-4xl">
            {article.title}
          </h1>

          {article.titleEN && article.titleEN !== article.title && (
            <p className="mt-2 font-serif text-lg italic text-gray-700">
              {article.titleEN}
            </p>
          )}

          {/* Authors */}
          {article.authors?.length > 0 && (
            <div className="mt-5 space-y-1">
              {article.authors.map((a, i) => (
                <p key={i} className="text-sm text-gray-800">
                  <span className="font-medium">
                    {a.title && `${a.title} `}
                    {a.name}
                  </span>
                  {a.isCorresponding && (
                    <span className="ml-1 text-emerald-700">✉</span>
                  )}
                  {a.affiliation && (
                    <span className="text-gray-500"> — {a.affiliation}</span>
                  )}
                </p>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 pt-4 text-xs text-gray-500">
            {article.publishedAt && (
              <span>
                Publié le{" "}
                {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {article.issue && (
              <>
                <span>·</span>
                <Link
                  href={`/cjp/issues/${article.issue.volume}/${article.issue.number}`}
                  className="hover:underline"
                >
                  Vol. {article.issue.volume}, No. {article.issue.number}
                </Link>
              </>
            )}
            {article.pages && (
              <>
                <span>·</span>
                <span>pp. {article.pages}</span>
              </>
            )}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <FaEye /> {article.views || 0}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <FaDownload /> {article.downloads || 0}
            </span>
          </div>
        </header>

        {/* Action bar */}
        <div className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {pdf && (
            <>
              <a
                href={pdf.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <FaFilePdf /> Lire le PDF
              </a>
              <a
                href={`/api/cjp/articles/${article._id}/download`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <FaDownload /> Télécharger
              </a>
            </>
          )}

          <button
            type="button"
            onClick={undefined}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            // Note: print handled client-side via the CitationBox component (not shown)
          >
            <FaQuoteLeft /> Citer
          </button>

          <div className="ml-auto">
            <ReportButton
              articleId={article._id.toString()}
              enabled={!!session && session.role !== "visiteur"}
            />
          </div>
        </div>

        {/* Abstracts */}
        {(article.abstractFR || article.abstractEN) && (
          <section className="mb-10 space-y-6">
            {article.abstractFR && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-serif text-lg font-bold text-gray-900">
                  Résumé
                </h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                  {article.abstractFR}
                </p>
                {article.keywordsFR?.length > 0 && (
                  <p className="mt-4 text-sm text-gray-600">
                    <strong className="font-medium">Mots-clés :</strong>{" "}
                    {article.keywordsFR.join(", ")}
                  </p>
                )}
              </div>
            )}

            {article.abstractEN && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 font-serif text-lg font-bold text-gray-900">
                  Abstract
                </h2>
                <p className="whitespace-pre-wrap text-[15px] italic leading-relaxed text-gray-800">
                  {article.abstractEN}
                </p>
                {article.keywordsEN?.length > 0 && (
                  <p className="mt-4 text-sm italic text-gray-600">
                    <strong className="font-medium">Keywords:</strong>{" "}
                    {article.keywordsEN.join(", ")}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Body */}
        <div className="space-y-6">
          {article.introduction && <BodySection title="Introduction">{article.introduction}</BodySection>}
          {article.methods && <BodySection title="Méthodes">{article.methods}</BodySection>}
          {article.results && <BodySection title="Résultats">{article.results}</BodySection>}
          {article.discussion && <BodySection title="Discussion">{article.discussion}</BodySection>}
          {article.conclusion && <BodySection title="Conclusion">{article.conclusion}</BodySection>}
        </div>

        {/* Declarations */}
        {(article.acknowledgments || article.funding || article.conflictsOfInterest || article.dataAvailability) && (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
              Déclarations
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              {article.funding && (
                <p><strong className="font-medium">Financement :</strong> {article.funding}</p>
              )}
              {article.conflictsOfInterest && (
                <p><strong className="font-medium">Conflits d'intérêts :</strong> {article.conflictsOfInterest}</p>
              )}
              {article.acknowledgments && (
                <p><strong className="font-medium">Remerciements :</strong> {article.acknowledgments}</p>
              )}
              {article.dataAvailability && (
                <p><strong className="font-medium">Disponibilité des données :</strong> {article.dataAvailability}</p>
              )}
            </div>
          </section>
        )}

        {/* References */}
        {article.references?.length > 0 && (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
              Références
            </h2>
            <ol className="space-y-3 text-sm text-gray-700">
              {article.references.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 font-medium text-gray-400">{i + 1}.</span>
                  <span>
                    {r.authors}
                    {r.year && ` (${r.year}).`}
                    {r.title && ` ${r.title}.`}
                    {r.journal && <em> {r.journal}</em>}
                    {r.volume && `, ${r.volume}`}
                    {r.issue && `(${r.issue})`}
                    {r.pages && `, ${r.pages}`}
                    {r.doi && (
                      <>
                        {" "}
                        <a
                          href={`https://doi.org/${r.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          doi:{r.doi}
                        </a>
                      </>
                    )}
                    {r.url && !r.doi && (
                      <>
                        {" "}
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          [Lien]
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Other attachments */}
        {otherAttachments.length > 0 && (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-gray-900">
              Documents complémentaires
            </h2>
            <ul className="space-y-2">
              {otherAttachments.map((a, i) => (
                <li key={i}>
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
                  >
                    <FaDownload className="text-xs" />
                    {a.label || a.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Comments */}
        <div className="mt-12">
          <CommentSection
            articleId={article._id.toString()}
            initialComments={comments}
            canComment={canComment}
            currentUserId={session?.sub || null}
          />
        </div>
      </article>
    </div>
  );
}

function BodySection({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 font-serif text-lg font-bold text-gray-900">
        {title}
      </h2>
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
        {children}
      </div>
    </section>
  );
}
