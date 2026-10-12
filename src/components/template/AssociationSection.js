// src/components/template/AssociationSection.js
import Image from "next/image";
import Link from "next/link";

const LEGAL_INFO = [
  { label: "Nature", value: "Association à but non lucratif" },
  { label: "Cadre légal", value: "Loi n°90/053 du 19 décembre 1990" },
  { label: "Assemblée constitutive", value: "2 avril 2026, Yaoundé" },
  { label: "Récépissé", value: "n° 000677/RDA/J06/SAAJP/BAPP du 28 avril 2026" },
  { label: "Préfecture", value: "Département du Mfoundi" },
  { label: "Durée", value: "99 ans" },
  { label: "Dénomination anglaise", value: "Cameroonian Society of Phytotherapy — CASOphy" },
  { label: "Siège", value: "Yaoundé, République du Cameroun" },
];

export default function AssociationSection() {
  return (
    <section id="association" className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header banner */}
        <div className="mx-auto max-w-3xl rounded-2xl bg-emerald-800 p-8 text-center text-white shadow-sm sm:p-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            L'association
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-50 sm:text-lg">
            Société savante à but non lucratif régie par la loi n°90/053 du 19
            décembre 1990, constituée pour quatre-vingt-dix-neuf ans, siège à
            Yaoundé.
          </p>
        </div>

        {/* Main grid */}
        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
          {/* Left column — Founder + legal info */}
          <div className="lg:col-span-2 space-y-8">
            <figure className="text-center">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border-4 border-orange-500 shadow-lg">
                <Image
                  src="/fondateur.jpg"
                  alt="Fondateur de la SOCAphy Médicale Foundation"
                  fill
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 text-base font-semibold text-emerald-900">
                Fondateur de la SOCAphy Médicale Foundation
              </figcaption>
            </figure>

            {/* Legal info — definition list, not table */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                Informations clés
              </h3>
              <dl className="space-y-3 text-sm">
                {LEGAL_INFO.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:gap-4"
                  >
                    <dt className="shrink-0 font-medium text-gray-500 sm:w-40">
                      {label}
                    </dt>
                    <dd className="text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right column — Narrative content */}
          <div className="lg:col-span-3 space-y-10">
            {/* Heritage */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
                Un héritage à éprouver
              </h3>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
                <p>
                  Le Cameroun abrite l'une des flores médicinales les plus
                  riches d'Afrique. Ses plantes soignent depuis des générations
                  — mais ce savoir, transmis oralement, reste fragmenté et
                  rarement validé par la science.
                </p>
                <p>
                  La SOCAphy est née de cette conviction : la phytothérapie
                  mérite d'être éprouvée, sécurisée et intégrée au système de
                  soins.
                </p>
              </div>
            </div>

            {/* Legal notice */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
                Mention portée au récépissé
              </h3>
              <blockquote className="mt-4 border-l-4 border-orange-400 pl-4 italic text-gray-700">
                « Cette association ne saurait fonctionner comme une formation
                sanitaire. »
              </blockquote>
              <p className="mt-3 text-base leading-relaxed text-gray-700">
                Les activités de la SOCAphy relèvent de la recherche, de
                l'expertise et de la formation, à l'exclusion de toute prise en
                charge de patients.
              </p>
            </div>

            {/* Mission */}
            <div>
              <h3 className="text-2xl font-bold text-emerald-900 sm:text-3xl">
                Mission statutaire
              </h3>
              <blockquote className="mt-4 border-l-4 border-emerald-500 pl-4 italic text-gray-700">
                « Promouvoir, encadrer et valoriser la phytothérapie comme
                discipline scientifique, médicale et sociale, dans une approche
                intégrative fondée sur des données probantes et des pratiques
                éthiques. »
              </blockquote>
              <p className="mt-3 text-sm font-medium text-gray-500">
                — Article 2 des statuts
              </p>
            </div>

            {/* CTA */}
            <div>
              <Link
                href="/association"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Voir le programme
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}