// src/app/cjp/submit/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import Masthead from "@/components/cjp/Masthead";
import ArticleForm from "@/components/cjp/ArticleForm";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { canSubmitToJournal } from "@/lib/cjp";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export const metadata = {
  title: "Soumettre un article",
};

export default async function SubmitPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/cjp/submit");

  if (!canSubmitToJournal(session.role)) {
    return (
      <div className="bg-gray-50">
        <Masthead />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 font-serif text-2xl font-bold text-gray-900">
            Accès restreint
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Seuls les membres SOCAphy, scientifiques et praticiens peuvent
            soumettre un article au journal.
          </p>
          <Link
            href="/cjp"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Retour au journal
          </Link>
        </div>
      </div>
    );
  }

  await connectDB();
  const info = await JournalInfo.findOne({ _key: "singleton" }).lean();

  return (
    <div>
      <Masthead info={info} compact />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/cjp"
          className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
        >
          <FaArrowLeft /> Retour au journal
        </Link>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            Soumettre un article
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Remplissez les informations ci-dessous. Vous pourrez enregistrer en
            brouillon ou soumettre directement pour évaluation.
          </p>
        </header>

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          💡 Les instructions complètes aux auteurs sont disponibles dans la
          section{" "}
          <Link href="/cjp/instructions" className="font-semibold underline">
            Instructions
          </Link>
          .
        </div>

        <ArticleForm />
      </div>
    </div>
  );
}
