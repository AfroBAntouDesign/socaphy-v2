// src/app/market/[id]/page.js
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft, FaStore, FaBoxOpen, FaShieldAlt, FaMapMarkerAlt,
  FaPhone, FaClock, FaExclamationTriangle,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/marketplace";
import ProductGallery from "./ProductGallery";

async function getProduct(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  return Product.findOne({ _id: id, status: "active" })
    .populate("shop", "name slug description city region phone logo openingHours status")
    .populate("owner", "name role")
    .lean();
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProduct(id);
  return {
    title: p ? `${p.name} | SOCAphy Marché` : "Produit introuvable",
    description: p?.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const outOfStock = product.stock === 0;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/market"
          className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <FaArrowLeft /> Retour au marché
        </Link>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            {product.images?.length > 0 ? (
              <ProductGallery images={product.images} name={product.name} />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-300">
                <FaBoxOpen className="text-6xl" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {PRODUCT_CATEGORY_LABELS[product.category] || product.category}
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Prix
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-900">
                    {product.price?.toLocaleString("fr-FR")}{" "}
                    <span className="text-base font-normal text-emerald-700">
                      {product.currency || "XAF"}
                    </span>
                  </p>
                  {product.unit && (
                    <p className="mt-0.5 text-xs text-emerald-700">
                      Conditionnement : {product.unit}
                    </p>
                  )}
                </div>
                {outOfStock ? (
                  <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                    Rupture de stock
                  </span>
                ) : (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    {product.stock} en stock
                  </span>
                )}
              </div>
            </div>

            {/* Shop card */}
            {product.shop && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vendu par
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
                    {product.shop.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.shop.logo} alt={product.shop.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                        {product.shop.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {product.shop.name}
                    </p>
                    {product.shop.city && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                        <FaMapMarkerAlt /> {product.shop.city}
                        {product.shop.region && `, ${product.shop.region}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {product.shop.phone && (
                    <p className="inline-flex items-center gap-2 text-gray-700">
                      <FaPhone className="text-xs text-gray-400" />
                      {product.shop.phone}
                    </p>
                  )}
                  {product.shop.openingHours && (
                    <p className="inline-flex items-center gap-2 text-gray-700">
                      <FaClock className="text-xs text-gray-400" />
                      {product.shop.openingHours}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Trust */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <FaShieldAlt className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Produit validé SOCAphy
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Ce produit a été examiné et validé par le comité scientifique
                    de la SOCAphy.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact note */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-medium text-orange-900">
                💡 Pour commander, contactez directement la boutique ci-dessus.
              </p>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Description">{product.description}</Section>
            {product.ingredients && (
              <Section title="Ingrédients">{product.ingredients}</Section>
            )}
            {product.usage && <Section title="Mode d'emploi">{product.usage}</Section>}
          </div>

          <div className="space-y-4">
            {product.precautions && (
              <WarningBox title="Précautions" tone="orange">
                {product.precautions}
              </WarningBox>
            )}
            {product.sideEffects && (
              <WarningBox title="Effets secondaires possibles" tone="red">
                {product.sideEffects}
              </WarningBox>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
              <p className="font-medium text-gray-700">Avertissement</p>
              <p className="mt-1">
                Ces informations sont fournies à titre indicatif. Consultez un
                professionnel de santé avant utilisation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {children}
      </p>
    </section>
  );
}

function WarningBox({ title, tone, children }) {
  const tones = {
    orange: "border-orange-200 bg-orange-50 text-orange-900",
    red: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold">
        <FaExclamationTriangle /> {title}
      </p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed opacity-90">
        {children}
      </p>
    </div>
  );
}