// src/app/users/communaute/nouveau/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import CommunityForm from "@/components/community/CommunityForm";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Créer une communauté | SOCAphy",
};

export default async function NewCommunityPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/communaute/nouveau");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users/communaute"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Retour aux communautés
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Créer une communauté
      </h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Rassemblez des membres autour d'un thème lié à la médecine traditionnelle.
      </p>

      <CommunityForm />
    </div>
  );
}