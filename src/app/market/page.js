// src/app/market/page.js
import Link from "next/link";
import {
  FaSearch, FaStore, FaBoxOpen, FaMapMarkerAlt,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Shop from "@/models/Shop";
import {
  PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS,
} from "@/lib/marketplace";

export const metadata = {
  title: "Marché | SOCAphy",
  description:
    "Découvrez les produits naturels validés par la SOCAphy — plantes médicinales, poudres, huiles, gélules.",
};

/* ------------------------------------------------------------------ */

async function listProducts({ q, category }) {
  await connectDB();
  const query = { status: "active" };
  if (category && category !== "all") query.category = category;
  if (q) query.$text = { $search: q };

  return Product.find(query)
    .sort({ createdAt: -1 })
    .limit(60)
    .populate("shop", "name city region status")
    .select("name slug description category price currency unit stock images shop createdAt")
    .lean();
}

async function listShops() {
  await connectDB();
  return Shop.find({ status: "active" })
    .sort({ activeProductCount: -1 })
    .limit(12)
    .select("name slug description logo city region activeProductCount")
    .lean();
}

/* ------------------------------------------------------------------ */

export default async function MarketPage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const category = PRODUCT_CATEGORIES.some((c) => c.value === params?.category)
    ? params.category
    : "all";

  const [products, shops] = await Promise.all([
    listProducts({ q, category }),
    listShops(),
  ]);

  const buildHref = (categoryKey) => {
    const p = new URLSearchParams();
    if (categoryKey !== "all") p.set("category", categoryKey);
    if (q) p.set("q", q);
    return `/market${p.toString() ? "?" + p : ""}`;
  };

  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-emerald-700">
            <FaStore />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Marché SOCAphy
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Produits naturels validés
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
            Tous les produits proposés ont été analysés et validés par le comité
            scientifique de la SOCAphy. Livraison par les boutiques partenaires.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                category === "all"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              Tous
            </Link>
            {PRODUCT_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={buildHref(c.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === c.value
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <form method="GET" className="flex w-full items-center gap-2 sm:w-auto">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            <div className="relative flex-1 sm:w-64">
              <FaSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Rechercher un produit…"
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
      </section>

      {/* Featured shops */}
      {shops.length > 0 && !q && category === "all" && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Boutiques en vedette
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shops.map((s) => (
              <Link
                key={s._id}
                href={`/market/shops/${s._id}`}
                className="flex w-56 shrink-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
                  {s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                      {s.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {s.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {s.activeProductCount || 0} produit
                    {s.activeProductCount > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <p className="text-4xl">🛒</p>
            <h3 className="mt-3 font-semibold text-gray-900">
              {q ? "Aucun résultat" : "Aucun produit disponible"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {q
                ? "Essayez d'autres mots-clés."
                : "Revenez bientôt — de nouveaux produits sont en cours de validation."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {products.length} produit{products.length > 1 ? "s" : ""}
              {q && (
                <>
                  {" "}pour « <strong className="text-gray-700">{q}</strong> »
                </>
              )}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={{ ...p, _id: p._id.toString() }} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      href={`/market/${product._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <FaBoxOpen className="text-4xl" />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-800">
              Rupture
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          {PRODUCT_CATEGORY_LABELS[product.category] || product.category}
        </span>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-emerald-800">
          {product.name}
        </h3>
        {product.shop?.name && (
          <p className="mt-1 inline-flex items-center gap-1 truncate text-xs text-gray-500">
            <FaStore className="text-[10px]" />
            {product.shop.name}
          </p>
        )}
        <div className="mt-2 flex flex-1 items-end justify-between">
          <p className="text-sm font-bold text-emerald-700">
            {product.price?.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-normal text-gray-500">
              {product.currency || "XAF"}
            </span>
          </p>
          {product.unit && (
            <span className="text-xs text-gray-400">{product.unit}</span>
          )}
        </div>
      </div>
    </Link>
  );
}