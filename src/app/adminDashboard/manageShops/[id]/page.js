// src/app/adminDashboard/manageShops/[id]/page.js
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  FaStore, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaUser,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { SHOP_STATUS_META, PRODUCT_STATUS_META, PRODUCT_CATEGORY_LABELS } from "@/lib/marketplace";
import AdminHeader from "@/components/admin/AdminHeader";
import ShopReview from "../ShopReview";
import ProductReview from "../ProductReview";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getShop(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return Shop.findById(id).populate("owner", "name email role avatar").lean();
}

async function getProducts(shopId) {
  await connectDB();
  return Product.find({ shop: shopId }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const s = await getShop(id);
  return { title: s ? `${s.name} | Admin` : "Boutique" };
}

export default async function ShopDetailPage({ params }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) notFound();

  const products = await getProducts(shop._id);
  const meta = SHOP_STATUS_META[shop.status] || SHOP_STATUS_META.pending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title={shop.name}
        subtitle={`Par ${shop.owner?.name || "—"}`}
        action={{ href: "/adminDashboard/manageShops", label: "← Toutes les boutiques" }}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${meta.pill}`}>
          {meta.label}
        </span>
        {shop.city && (
          <span className="text-xs text-gray-600">
            📍 {shop.city}
            {shop.region && `, ${shop.region}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Info */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {shop.description}
            </p>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Coordonnées
            </h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              {shop.phone && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <FaPhone className="text-gray-400" /> {shop.phone}
                </div>
              )}
              {shop.email && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <FaEnvelope className="text-gray-400" /> {shop.email}
                </div>
              )}
              {shop.address && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="text-gray-400" /> {shop.address}
                </div>
              )}
              {shop.openingHours && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <FaClock className="text-gray-400" /> {shop.openingHours}
                </div>
              )}
              {shop.licenseNumber && (
                <div className="inline-flex items-center gap-2 text-gray-700">
                  <FaStore className="text-gray-400" /> Licence : {shop.licenseNumber}
                </div>
              )}
            </dl>
          </section>

          {/* Products */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Produits ({products.length})
              </h2>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun produit.</p>
            ) : (
              <ul className="space-y-3">
                {products.map((p) => {
                  const pmeta = PRODUCT_STATUS_META[p.status] || PRODUCT_STATUS_META.pending;
                  return (
                    <li key={p._id} className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">📦</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${pmeta.pill}`}>
                            {pmeta.label}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {PRODUCT_CATEGORY_LABELS[p.category] || p.category}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-600">
                          {p.price?.toLocaleString("fr-FR")} {p.currency || "XAF"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <ProductReview product={{ _id: p._id.toString(), name: p.name, status: p.status }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Propriétaire
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700">
                {shop.owner?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.owner.avatar} alt={shop.owner.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {shop.owner?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {shop.owner?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {ROLE_LABELS[shop.owner?.role] || shop.owner?.role}
                </p>
              </div>
            </div>
            {shop.owner?._id && (
              <Link
                href={`/adminDashboard/manageUsers/${shop.owner._id}`}
                className="mt-3 inline-block text-xs font-medium text-emerald-700 hover:underline"
              >
                Voir le profil complet →
              </Link>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </h3>
            <ShopReview shop={{ _id: shop._id.toString(), name: shop.name, status: shop.status }} />
          </div>
        </aside>
      </div>
    </div>
  );
}