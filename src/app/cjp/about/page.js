// src/app/cjp/about/page.js
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import Masthead from "@/components/cjp/Masthead";

export const metadata = {
  title: "À propos",
};

async function getInfo() {
  await connectDB();
  return JournalInfo.findOne({ _key: "singleton" }).lean();
}

export default async function AboutPage() {
  const info = await getInfo();

  return (
    <div>
      <Masthead info={info} compact />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            À propos du journal
          </h1>
        </header>

        {/* Key info grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoBox label="ISSN" value={info?.issn || "XXXX-XXXX"} />
          <InfoBox label="Fréquence" value={info?.frequency || "Continu"} />
          <InfoBox
            label="Accès"
            value={info?.openAccess ? "Libre (Open Access)" : "Abonnement"}
          />
        </div>

        {info?.descriptionFR && (
          <Section title="Description" subtitle="Description">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
              {info.descriptionFR}
            </p>
          </Section>
        )}

        {info?.descriptionEN && (
          <Section title="Description (EN)">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800 italic">
              {info.descriptionEN}
            </p>
          </Section>
        )}

        {info?.scopeFR && (
          <Section title="Domaines couverts" subtitle="Scope">
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
              {info.scopeFR}
            </div>
          </Section>
        )}

        {info?.scopeEN && (
          <Section title="Scope (EN)">
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed italic text-gray-800">
              {info.scopeEN}
            </div>
          </Section>
        )}

        {info?.ethicsFR && (
          <Section title="Éthique et politiques">
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
              {info.ethicsFR}
            </div>
          </Section>
        )}

        <Section title="Contact">
          <ul className="space-y-2 text-sm text-gray-700">
            {info?.contactEmail && (
              <li>
                <strong>Email :</strong> {info.contactEmail}
              </li>
            )}
            {info?.contactPhone && (
              <li>
                <strong>Téléphone :</strong> {info.contactPhone}
              </li>
            )}
            {info?.contactAddress && (
              <li>
                <strong>Adresse :</strong> {info.contactAddress}
              </li>
            )}
            {(info?.contactCity || info?.contactCountry) && (
              <li>
                <strong>Localisation :</strong> {info.contactCity}
                {info.contactCountry && `, ${info.contactCountry}`}
              </li>
            )}
            {info?.publisher && (
              <li>
                <strong>Éditeur :</strong> {info.publisher}
              </li>
            )}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h2 className="font-serif text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && subtitle !== title && (
          <p className="mt-0.5 text-xs italic text-gray-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
