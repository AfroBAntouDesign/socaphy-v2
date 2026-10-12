// src/app/cjp/editorial-board/page.js
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import JournalBoardMember from "@/models/JournalBoardMember";
import Masthead from "@/components/cjp/Masthead";
import { BOARD_ROLE_LABELS } from "@/lib/cjp";

export const metadata = {
  title: "Comité éditorial",
};

async function getData() {
  await connectDB();
  const [info, members] = await Promise.all([
    JournalInfo.findOne({ _key: "singleton" }).lean(),
    JournalBoardMember.find({ isActive: true })
      .sort({ role: 1, order: 1, name: 1 })
      .lean(),
  ]);

  const grouped = {
    editor_in_chief: [],
    editor: [],
    board_member: [],
    secretariat: [],
  };
  for (const m of members) {
    if (grouped[m.role]) grouped[m.role].push({ ...m, _id: m._id.toString() });
  }
  return { info, grouped };
}

export default async function EditorialBoardPage() {
  const { info, grouped } = await getData();

  return (
    <div>
      <Masthead info={info} compact />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            Comité éditorial
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Le comité scientifique du Cameroonian Journal of Phytotherapae.
          </p>
        </header>

        {grouped.editor_in_chief.length > 0 && (
          <Section title="Éditeur en Chef" tone="emerald">
            <div className="space-y-4">
              {grouped.editor_in_chief.map((m) => (
                <MemberCard key={m._id} member={m} featured />
              ))}
            </div>
          </Section>
        )}

        {grouped.editor.length > 0 && (
          <Section title="Éditeurs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {grouped.editor.map((m) => (
                <MemberCard key={m._id} member={m} />
              ))}
            </div>
          </Section>
        )}

        {grouped.board_member.length > 0 && (
          <Section title="Comité éditorial">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {grouped.board_member.map((m) => (
                <MemberCard key={m._id} member={m} compact />
              ))}
            </div>
          </Section>
        )}

        {grouped.secretariat.length > 0 && (
          <Section title="Secrétariat">
            <div className="space-y-3">
              {grouped.secretariat.map((m) => (
                <MemberCard key={m._id} member={m} compact />
              ))}
            </div>
          </Section>
        )}

        {Object.values(grouped).every((arr) => arr.length === 0) && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-medium text-gray-800">
              Le comité éditorial n'a pas encore été renseigné
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, tone, children }) {
  return (
    <section className="mb-10">
      <h2
        className={`mb-4 font-serif text-xl font-bold ${
          tone === "emerald" ? "text-emerald-800" : "text-gray-900"
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MemberCard({ member, featured = false, compact = false }) {
  const subtitle =
    member.title && member.affiliation
      ? `${member.title} — ${member.affiliation}`
      : member.title || member.affiliation || "";

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        featured ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-bold text-white ${
            featured ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg"
          }`}
        >
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            member.name?.[0]?.toUpperCase() || "?"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`font-serif font-bold text-gray-900 ${
              featured ? "text-xl" : "text-base"
            }`}
          >
            {member.title && <span className="text-emerald-700">{member.title} </span>}
            {member.name}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
          {!compact && member.biography && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
              {member.biography}
            </p>
          )}
          {member.email && (
            <p className="mt-2 text-xs text-gray-500">{member.email}</p>
          )}
        </div>
      </div>
    </article>
  );
}
