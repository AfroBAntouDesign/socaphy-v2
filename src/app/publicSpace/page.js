// src/app/publicSpace/page.js
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import PublicArticleCard from "@/components/articles/PublicArticleCard";
import { FaSearch, FaGlobe } from "react-icons/fa";

export const metadata = {
  title: "Place publique | SOCAphy",
  description:
    "Découvrez les articles scientifiques et pratiques traditionnelles validés par la SOCAphy.",
};

const KINDS = [
  { key: "all", label: "Tous" },
  { key: "scientific", label: "Scientifiques" },
  { key: "practical", label: "Pratiques" },
];

/* ------------------------------------------------------------------ */

async function listValidated({ q, kind }) {
  await connectDB();

  const query = { status: "validated" };
  if (kind && kind !== "all") query.kind = kind;
  if (q) {
    // Uses the text index: title, abstract, description
    query.$text = { $search: q };
  }

  return Article.find(query)
    .sort({ validatedAt: -1, updatedAt: -1 })
    .limit(60)
    .populate("user", "name role")
    .select(
      "title kind abstract description tags attachments user validatedAt updatedAt"
    )
    .lean();
}

/* ------------------------------------------------------------------ */

export default async function PublicSpacePage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const kind = KINDS.some((k) => k.key === params?.kind) ? params.kind : "all";

  const articles = await listValidated({ q, kind });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-emerald-700">
          <FaGlobe />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Place publique
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Articles validés par la SOCAphy
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
          Toutes les publications scientifiques et pratiques traditionnelles
          vérifiées par le comité scientifique de la SOCAphy.
        </p>
      </header>

      {/* Search + filters */}
      <form
        method="GET"
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <FaSearch className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un titre, une plante, une maladie…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-11 text-sm text-gray-900 placeholder-gray-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex gap-2">
          {KINDS.map((k) => {
            const active = kind === k.key;
            const url = new URLSearchParams();
            if (q) url.set("q", q);
            if (k.key !== "all") url.set("kind", k.key);
            return (
              <Link
                key={k.key}
                href={`/publicSpace${url.toString() ? "?" + url : ""}`}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {k.label}
              </Link>
            );
          })}
        </div>
      </form>

      {/* Results */}
      {articles.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <h2 className="mt-3 font-semibold text-gray-900">
            {q ? "Aucun résultat" : "Aucun article publié"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Essayez d'autres mots-clés."
              : "Revenez bientôt — les premiers articles validés apparaîtront ici."}
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <PublicArticleCard key={a._id} article={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}