// src/app/association/page.js
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import MembersCarousel from "@/components/association/MembersCarousel";
import OrganigrammeSection from "@/components/association/OrganigrammeSection";

export const metadata = {
  title: "L'association | SOCAphy",
  description:
    "Découvrez les membres, organes et le fonctionnement de la SOCAphy — Société savante camerounaise de phytothérapie.",
};

export default function AssociationPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
          >
            <FaArrowLeft /> Retour à l'accueil
          </Link>

          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            L'association
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            La SOCAphy en quelques mots
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Société savante à but non lucratif régie par la loi n°90/053 du 19
            décembre 1990, constituée pour quatre-vingt-dix-neuf ans, siège à
            Yaoundé. Elle promeut, encadre et valorise la phytothérapie comme
            discipline scientifique, médicale et sociale.
          </p>
        </div>
      </section>

      {/* Carousel */}
      <MembersCarousel />

      {/* Organigramme */}
      <OrganigrammeSection />
    </div>
  );
}