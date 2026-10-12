// src/app/users/boutique/nouveau/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft, FaStore } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import {
  SHOP_OWNER_ROLES,
  REQUIRES_VALIDATED_ARTICLE,
} from "@/lib/marketplace";
import ShopForm from "@/components/marketplace/ShopForm";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Créer ma boutique | SOCAphy",
};

export default async function NewShopPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/boutique/nouveau");
  if (!SHOP_OWNER_ROLES.includes(session.role)) redirect("/users/boutique");

  await connectDB();

  const existing = await Shop.findOne({ owner: session.sub });
  if (existing) redirect("/users/boutique");

  if (REQUIRES_VALIDATED_ARTICLE.includes(session.role)) {
    const count = await Article.countDocuments({
      user: session.sub,
      status: "validated",
    });
    if (count === 0) redirect("/users/boutique");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/boutique"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Retour
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <FaStore />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Créer ma boutique
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Nouvelle boutique
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Renseignez les informations de votre boutique. Elle sera examinée par
          un administrateur avant publication.
        </p>
      </div>

      <ShopForm mode="create" />
    </div>
  );
}
