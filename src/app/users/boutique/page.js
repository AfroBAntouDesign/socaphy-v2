// src/app/users/boutique/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaStore, FaPlus, FaBoxOpen, FaEye, FaCheckCircle, FaClock,
  FaTimesCircle, FaBan, FaArrowRight,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import {
  SHOP_OWNER_ROLES, REQUIRES_VALIDATED_ARTICLE, SHOP_STATUS_META,
} from "@/lib/marketplace";

const STATUS_ICONS = {
  pending: FaClock,
  active: FaCheckCircle,
  rejected: FaTimesCircle,
  suspended: FaBan,
  archived: FaBan,
};

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function getData(userId) {
  await connectDB();

  const mongoose = (await import("mongoose")).default;

  const [shop, productCounts, articleCount] = await Promise.all([
    Shop.findOne({ owner: userId }).lean(),
    Product.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Article.countDocuments({ user: userId, status: "validated" }),
  ]);

  const counts = { total: 0, pending: 0, active: 0, rejected: 0, out_of_stock: 0 };
  for (const r of productCounts) {
    counts[r._id] = r.count;
    counts.total += r.count;
  }

  return { shop, counts, articleCount };
}

export const metadata = {
  title: "Ma boutique | SOCAphy",
};

export default async function BoutiquePage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/boutique");

  const canOpenShop = SHOP_OWNER_ROLES.includes(session.role);
  const { shop, counts, articleCount } = await getData(session.sub);

  // Not allowed at all
  if (!canOpenShop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Accès boutique non disponible
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Votre rôle actuel ne permet pas d'ouvrir une boutique.
        </p>
        <Link
          href="/users/profile"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Retour au profil
        </Link>
      </div>
    );
  }

  // Condition: scientists need validated article
  const requiresArticle = REQUIRES_VALIDATED_ARTICLE.includes(session.role);
  const blockedByArticle = requiresArticle && articleCount === 0;

  // No shop yet
  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <FaStore className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ouvrez votre boutique
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Vendez vos produits naturels validés scientifiquement sur le marché
            SOCAphy.
          </p>

          {blockedByArticle ? (
            <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5 text-left">
              <p className="font-medium text-orange-900">
                ⚠️ Condition requise : article scientifique validé
              </p>
              <p className="mt-1 text-sm text-orange-800">
                En tant que scientifique / membre SOCAphy, vous devez avoir au
                moins <strong>un article validé</strong> par le comité
                scientifique avant d'ouvrir une boutique.
              </p>
              <Link
                href="/users/scientifique/nouveau"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Créer un article <FaArrowRight className="text-xs" />
              </Link>
            </div>
          ) : (
            <Link
              href="/users/boutique/nouveau"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <FaPlus /> Créer ma boutique
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Has shop
  const statusMeta = SHOP_STATUS_META[shop.status] || SHOP_STATUS_META.pending;
  const StatusIcon = STATUS_ICONS[shop.status] || FaClock;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Tag + Title + Status ───────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <FaStore />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Ma boutique
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {shop.name}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusMeta.pill}`}
          >
            <StatusIcon /> {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Status banners */}
      {shop.status === "pending" && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
          <p className="font-medium text-orange-900">En attente de validation</p>
          <p className="mt-1 text-sm text-orange-800">
            Votre boutique sera visible publiquement après validation par un
            administrateur.
          </p>
        </div>
      )}

      {shop.status === "rejected" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-900">Boutique refusée</p>
          {shop.rejectionReason && (
            <p className="mt-1 text-sm text-red-800">
              Motif : {shop.rejectionReason}
            </p>
          )}
          <Link
            href="/users/boutique/modifier"
            className="mt-3 inline-block text-sm font-semibold text-red-700 hover:underline"
          >
            Modifier ma boutique →
          </Link>
        </div>
      )}

      {shop.status === "suspended" && (
        <div className="mb-6 rounded-xl border border-gray-300 bg-gray-100 p-5">
          <p className="font-medium text-gray-900">Boutique suspendue</p>
          <p className="mt-1 text-sm text-gray-700">
            Contactez un administrateur pour plus d'informations.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total produits" value={counts.total} tone="emerald" />
        <StatCard label="En vente" value={counts.active} tone="emerald" />
        <StatCard label="En attente" value={counts.pending} tone="orange" />
        <StatCard label="Refusés" value={counts.rejected} tone="red" />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/users/boutique/produits"
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FaBoxOpen className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mes produits</h3>
              <p className="text-sm text-gray-500">
                Gérer, modifier, publier vos produits
              </p>
            </div>
          </div>
          <FaArrowRight className="text-emerald-700" />
        </Link>

        <Link
          href="/market"
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <FaEye className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Voir le marché</h3>
              <p className="text-sm text-gray-500">
                Parcourir tous les produits validés
              </p>
            </div>
          </div>
          <FaArrowRight className="text-orange-600" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
    red: "bg-red-50 text-red-800 ring-red-100",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
