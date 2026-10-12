// src/app/users/boutique/produits/nouveau/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import ProductForm from "@/components/marketplace/ProductForm";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Nouveau produit | SOCAphy",
};

export default async function NewProductPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/boutique/produits/nouveau");

  await connectDB();
  const shop = await Shop.findOne({ owner: session.sub });
  if (!shop) redirect("/users/boutique");
  if (shop.status !== "active") redirect("/users/boutique");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/boutique/produits"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Mes produits
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <FaPlus />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Nouveau produit
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {shop.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Renseignez les informations du produit. Il sera examiné par un
          administrateur avant publication sur le marché.
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
