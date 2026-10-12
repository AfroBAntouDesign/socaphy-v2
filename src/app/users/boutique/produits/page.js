// src/app/users/boutique/produits/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaPlus, FaArrowLeft, FaEdit, FaEye, FaBoxOpen, FaStore,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { PRODUCT_STATUS_META, PRODUCT_CATEGORY_LABELS } from "@/lib/marketplace";
import ProductRowActions from "./ProductRowActions";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Mes produits | SOCAphy",
};

export default async function MyProductsPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/boutique/produits");

  await connectDB();

  const shop = await Shop.findOne({ owner: session.sub }).lean();
  if (!shop) redirect("/users/boutique");

  const params = await searchParams;
  const statusFilter = params?.status || "all";

  const query = { owner: session.sub };
  if (statusFilter !== "all") query.status = statusFilter;

  const products = await Product.find(query)
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  const shopActive = shop.status === "active";

  const TABS = [
    { key: "all", label: "Tous" },
    { key: "pending", label: "En attente" },
    { key: "active", label: "En vente" },
    { key: "rejected", label: "Refusés" },
    { key: "out_of_stock", label: "Rupture" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/boutique"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Ma boutique
      </Link>

      {/* ── Tag + Title ─────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700">
            <FaStore />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Mes produits
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {shop.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {products.length} produit{products.length > 1 ? "s" : ""}
            {statusFilter !== "all" && " dans ce filtre"}
          </p>
        </div>

        {shopActive ? (
          <Link
            href="/users/boutique/produits/nouveau"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FaPlus /> Nouveau produit
          </Link>
        ) : (
          <span className="rounded-lg bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-800 ring-1 ring-orange-200">
            Boutique non active — validation requise
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = statusFilter === t.key;
          return (
            <Link
              key={t.key}
              href={`/users/boutique/produits?status=${t.key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">📦</p>
          <h3 className="mt-3 font-semibold text-gray-900">
            Aucun produit dans cette catégorie
          </h3>
          {shopActive && (
            <Link
              href="/users/boutique/produits/nouveau"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <FaPlus /> Créer un produit
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {products.map((p) => {
              const meta = PRODUCT_STATUS_META[p.status] || PRODUCT_STATUS_META.pending;
              return (
                <li key={p._id} className="p-4 transition hover:bg-gray-50/60">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <FaBoxOpen className="text-xl" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}>
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {PRODUCT_CATEGORY_LABELS[p.category] || p.category}
                        </span>
                      </div>
                      <h3 className="mt-1 truncate font-medium text-gray-900">{p.name}</h3>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {p.price?.toLocaleString("fr-FR")} {p.currency || "XAF"}
                        {p.unit && ` · ${p.unit}`}
                        {typeof p.stock === "number" && ` · Stock : ${p.stock}`}
                      </p>
                      {p.rejectionReason && p.status === "rejected" && (
                        <p className="mt-1 text-xs italic text-red-500">
                          Motif : {p.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      {p.status === "active" && (
                        <Link
                          href={`/market/${p._id}`}
                          target="_blank"
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                          title="Voir sur le marché"
                        >
                          <FaEye />
                        </Link>
                      )}
                      <Link
                        href={`/users/boutique/produits/${p._id}`}
                        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                        title="Modifier"
                      >
                        <FaEdit />
                      </Link>
                      <ProductRowActions product={{ _id: p._id.toString(), name: p.name }} />
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
