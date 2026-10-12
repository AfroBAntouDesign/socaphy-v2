// src/app/cjp/instructions/page.js
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import Masthead from "@/components/cjp/Masthead";

export const metadata = {
  title: "Instructions aux auteurs",
};

async function getInfo() {
  await connectDB();
  return JournalInfo.findOne({ _key: "singleton" }).lean();
}

export default async function InstructionsPage() {
  const info = await getInfo();

  const textFR = info?.instructionsFR;
  const textEN = info?.instructionsEN;

  return (
    <div>
      <Masthead info={info} compact />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            Instructions aux auteurs
          </h1>
          <p className="mt-1 text-sm italic text-gray-500">
            Instructions for authors
          </p>
        </header>

        {/* Info banner */}
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            Ces instructions sont publiées alternativement en français et en
            anglais. Le respect strict de ces instructions est requis avant
            toute considération pour évaluation et/ou publication.
          </p>
        </div>

        {!textFR && !textEN && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-4xl">📝</p>
            <p className="mt-3 font-medium text-gray-800">
              Instructions à venir
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Les instructions aux auteurs seront publiées prochainement.
            </p>
          </div>
        )}

        {textFR && (
          <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 border-b border-gray-100 pb-3 font-serif text-xl font-bold text-gray-900">
              Instructions aux auteurs (Français)
            </h2>
            <div className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-gray-800">
              {textFR}
            </div>
          </section>
        )}

        {textEN && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 border-b border-gray-100 pb-3 font-serif text-xl font-bold text-gray-900">
              Instructions for Authors (English)
            </h2>
            <div className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-gray-800">
              {textEN}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
