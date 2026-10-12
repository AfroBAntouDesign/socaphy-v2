// src/components/articles/PublicArticleCard.jsx
import Link from "next/link";
import { FaFileAlt, FaPaperclip, FaUser } from "react-icons/fa";

const KIND_LABEL = {
  scientific: "Article scientifique",
  practical: "Pratique / Protocole",
};

export default function PublicArticleCard({ article }) {
  const excerpt = article.abstract || article.description || "";
  const trimmed = excerpt.length > 180 ? excerpt.slice(0, 180).trim() + "…" : excerpt;

  return (
    <Link
      href={`/publicSpace/${article._id}`}
      className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          {KIND_LABEL[article.kind] || "Article"}
        </span>
        {article.attachments?.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <FaPaperclip /> {article.attachments.length}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-emerald-800">
        {article.title}
      </h3>

      {trimmed && (
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
          {trimmed}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <FaUser className="opacity-60" />
          {article.user?.name || "Auteur anonyme"}
        </span>
        <span>
          {new Date(article.validatedAt || article.updatedAt).toLocaleDateString(
            "fr-FR",
            { day: "2-digit", month: "short", year: "numeric" }
          )}
        </span>
      </div>
    </Link>
  );
}