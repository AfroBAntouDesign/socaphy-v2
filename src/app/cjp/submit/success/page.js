// src/app/cjp/submit/success/page.js
import Link from "next/link";
import { FaCheckCircle, FaBook } from "react-icons/fa";
import Masthead from "@/components/cjp/Masthead";

export const metadata = {
  title: "Soumission reçue",
};

export default function SubmitSuccessPage() {
  return (
    <div>
      <Masthead compact />

      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <FaCheckCircle className="text-3xl" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-gray-900">
          Soumission reçue
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Merci pour votre contribution au Cameroonian Journal of Phytotherapae.
          Votre article sera examiné par le comité scientifique. Vous serez
          notifié par email une fois l'évaluation terminée.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/users/cjp"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FaBook /> Voir mes soumissions
          </Link>
          <Link
            href="/cjp"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Retour au journal
          </Link>
        </div>
      </div>
    </div>
  );
}
