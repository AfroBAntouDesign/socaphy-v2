// src/app/adminDashboard/manageShops/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { SHOP_STATUS_META, PRODUCT_STATUS_META } from "@/lib/marketplace";
import AdminHeader from "@/components/admin/AdminHeader";
import ShopReview from "./ShopReview";

const SHOP_TABS = [
  { key: "pending", label: "Boutiques en attente" },
  { key: "active", label: "Boutiques actives" },
  { key: "products_pending", label: "Produits à valider" },
  { key: "rejected", label: "Boutiques refusées" },
  { key: "all", label: "Toutes" },
];

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getCounts() {
  await connectDB();
  const [shopRows, productRows] = await Promise.all([
    Shop.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: { status: "pending" } },
      { $count: "count" },
    ]),
  ]);

  const counts = { all: 0, pending: 0, active: 0, rejected: 0, suspended: 0, archived: 0, products_pending: productRows[0]?.count || 0 };
  for (const r of shopRows) {
    counts[r._id] = r.count;
    counts.all += r.count;
  }
  return counts;
}

async function listShops(status) {
  await connectDB();
  const query = status === "all" ? {} : { status };
  return Shop.find(query)
    .sort({ createdAt: -1 })
    .limit(80)
    .populate("owner", "name email role")
    .lean();
}

async function listPendingProducts() {
  await connectDB();
  return Product.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(80)
    .populate("owner", "name email role")
    .populate("shop", "name status")
    .lean();
}

export const metadata = {
  title: "Boutiques & Marché | Admin SOCAphy",
};

export default async function ManageShopsPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const status = SHOP_TABS.some((t) => t.key === params?.status)
    ? params.status
    : "pending";

  const isProductView = status === "products_pending";

  const [counts, shopList, productList] = await Promise.all([
    getCounts(),
    isProductView ? Promise.resolve([]) : listShops(status),
    isProductView ? listPendingProducts() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Boutiques & Marché"
        subtitle="Validez les boutiques et les produits soumis par les vendeurs"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SHOP_TABS.map((t) => {
          const active = status === t.key;
          const count = counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/adminDashboard/manageShops?status=${t.key}`}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {isProductView ? (
        <ProductList products={productList} />
      ) : (
        <ShopList shops={shopList} />
      )}
    </div>
  );
}

function ShopList({ shops }) {
  if (shops.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-4xl">🏪</p>
        <h3 className="mt-3 font-semibold text-gray-900">Aucune boutique dans cette catégorie</h3>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <ul className="divide-y divide-gray-100">
        {shops.map((s) => {
          const meta = SHOP_STATUS_META[s.status] || SHOP_STATUS_META.pending;
          return (
            <li key={s._id} className="p-5 hover:bg-gray-50/60">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}>
                      {meta.label}
                    </span>
                    {s.city && (
                      <span className="text-xs text-gray-500">📍 {s.city}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {s.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>
                      Par{" "}
                      <strong className="text-gray-700">
                        {s.owner?.name || "—"}
                      </strong>{" "}
                      ({s.owner?.email})
                    </span>
                    <span>·</span>
                    <span>
                      {s.productCount || 0} produit
                      {s.productCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  {s.rejectionReason && (
                    <p className="mt-1 text-xs italic text-red-500">
                      Motif : {s.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <ShopReview
                    shop={{ _id: s._id.toString(), name: s.name, status: s.status }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-4xl">📦</p>
        <h3 className="mt-3 font-semibold text-gray-900">Aucun produit en attente</h3>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <ul className="divide-y divide-gray-100">
        {products.map((p) => {
          const meta = PRODUCT_STATUS_META[p.status] || PRODUCT_STATUS_META.pending;
          return (
            <li key={p._id} className="p-5 hover:bg-gray-50/60">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">📦</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.pill}`}>
                        {meta.label}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {p.shop?.name || "—"}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-900">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>
                        Par{" "}
                        <strong className="text-gray-700">
                          {p.owner?.name || "—"}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        {p.price?.toLocaleString("fr-FR")} {p.currency || "XAF"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <ProductReview
                    product={{ _id: p._id.toString(), name: p.name, status: p.status }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import ProductReview from "./ProductReview";