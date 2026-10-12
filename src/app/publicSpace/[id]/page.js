// src/app/publicSpace/[id]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { ROLE_LABELS } from "@/lib/roles";
import {
  FaArrowLeft, FaUser, FaCalendarAlt, FaEye, FaDownload, FaPaperclip,
} from "react-icons/fa";

/* ------------------------------------------------------------------ */

async function getArticle(id) {
  // Basic ObjectId validation
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  await connectDB();
  return Article.findOne({ _id: id, status: "validated" })
    .populate("user", "name role biography")
    .lean();
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Article introuvable" };

  return {
    title: `${article.title} | SOCAphy`,
    description:
      (article.abstract || article.description || "").slice(0, 160) || undefined,
  };
}

/* ------------------------------------------------------------------ */

export default async function PublicArticlePage({ params }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const isScientific = article.kind === "scientific";

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/publicSpace"
        className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Retour à la place publique
      </Link>

      {/* Badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          {isScientific ? "Article scientifique" : "Pratique / Protocole"}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Validé
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-gray-200 pb-6 text-sm text-gray-600">
        <span className="inline-flex items-center gap-2">
          <FaUser className="opacity-60" />
          <span>
            {article.user?.name || "Auteur anonyme"}
            {article.user?.role && (
              <span className="ml-1 text-gray-500">
                · {ROLE_LABELS[article.user.role] || article.user.role}
              </span>
            )}
          </span>
        </span>

        {(article.validatedAt || article.updatedAt) && (
          <span className="inline-flex items-center gap-2">
            <FaCalendarAlt className="opacity-60" />
            {new Date(article.validatedAt || article.updatedAt).toLocaleDateString(
              "fr-FR",
              { day: "2-digit", month: "long", year: "numeric" }
            )}
          </span>
        )}
      </div>

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="mt-8 space-y-6">
        {isScientific ? (
          <>
            {article.abstract && <Section title="Résumé">{article.abstract}</Section>}
            {article.introduction && <Section title="Introduction">{article.introduction}</Section>}
            {article.methods && <Section title="Méthodes">{article.methods}</Section>}
            {article.results && <Section title="Résultats">{article.results}</Section>}
            {article.discussion && <Section title="Discussion">{article.discussion}</Section>}
            {article.references?.length > 0 && (
              <Section title="Références">
                <ol className="ml-5 list-decimal space-y-1 text-sm">
                  {article.references.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </Section>
            )}
          </>
        ) : (
          <>
            {article.description && <Section title="Description">{article.description}</Section>}
            {article.ingredient && <Section title="Ingrédient / Plante">{article.ingredient}</Section>}
            {article.advantages && <Section title="Avantages">{article.advantages}</Section>}
            {article.usage && <Section title="Usage">{article.usage}</Section>}
            {article.sideEffects && (
              <Section title="Effets secondaires" tone="warning">
                {article.sideEffects}
              </Section>
            )}
            {article.precautions && (
              <Section title="Précautions" tone="warning">
                {article.precautions}
              </Section>
            )}
            {article.region && <Section title="Région d'origine">{article.region}</Section>}
          </>
        )}
      </div>

      {/* Attachments */}
      {article.attachments?.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FaPaperclip className="text-emerald-600" />
            Pièces jointes ({article.attachments.length})
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {article.attachments.map((att, i) => (
              <AttachmentCard key={i} att={att} />
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-12 rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-900">
        <p className="font-semibold">Avertissement</p>
        <p className="mt-1 text-orange-800">
          Ces contenus sont publiés à titre informatif et scientifique. Ils ne
          remplacent en aucun cas un avis médical professionnel. Consultez un
          praticien de santé avant toute utilisation thérapeutique.
        </p>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

function Section({ title, tone = "default", children }) {
  const cls =
    tone === "warning"
      ? "border-l-4 border-orange-400 bg-orange-50/60 pl-4 py-3 rounded-r-lg"
      : "";
  return (
    <section className={cls}>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

function AttachmentCard({ att }) {
  const isPdf = att.type === "pdf";
  const isImage = att.type === "image";

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">
          {att.originalName}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {att.type.toUpperCase()} · {(att.size / 1024).toFixed(0)} Ko
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        {(isPdf || isImage) && (
          <a
            href={att.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
            title="Aperçu"
          >
            <FaEye />
          </a>
        )}
        <a
          href={att.fileUrl}
          download={att.originalName}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          title="Télécharger"
        >
          <FaDownload />
        </a>
      </div>
    </li>
  );
}