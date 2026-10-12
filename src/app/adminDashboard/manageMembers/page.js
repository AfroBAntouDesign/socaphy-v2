// src/app/adminDashboard/manageMembers/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Cv from "@/models/Cv";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import MemberCard from "./MemberCard";
import AddMemberModal from "./AddMemberModal";

/* ------------------------------------------------------------------ */

const TABS = [
  { key: "members", label: "Membres SOCAphy" },
  { key: "candidates", label: "Candidats à promouvoir" },
];

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function listMembers() {
  await connectDB();
  const users = await User.find({ role: "adminSOCAphy" })
    .sort({ createdAt: -1 })
    .select("name email role status avatar createdAt")
    .lean();

  return enrich(users);
}

async function listCandidates() {
  await connectDB();
  const users = await User.find({
    role: { $in: ["scientifique", "praticienSante", "clinic", "tradiPraticien"] },
    status: "active",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("name email role status avatar createdAt")
    .lean();

  return enrich(users);
}

/** Add hasCv + articleCount to each user */
async function enrich(users) {
  if (users.length === 0) return [];
  const ids = users.map((u) => u._id);

  const [cvRows, articleRows] = await Promise.all([
    Cv.aggregate([
      { $match: { user: { $in: ids }, status: "approved" } },
      { $group: { _id: "$user" } },
    ]),
    Article.aggregate([
      { $match: { user: { $in: ids } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]),
  ]);

  const cvSet = new Set(cvRows.map((r) => r._id.toString()));
  const articleMap = new Map(articleRows.map((r) => [r._id.toString(), r.count]));

  return users.map((u) => ({
    ...u,
    _id: u._id.toString(),
    hasCv: cvSet.has(u._id.toString()),
    articleCount: articleMap.get(u._id.toString()) || 0,
  }));
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Membres SOCAphy | Admin",
};

export default async function ManageMembersPage({ searchParams }) {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const params = await searchParams;
  const tab = TABS.some((t) => t.key === params?.tab)
    ? params.tab
    : "members";

  const [members, candidates] = await Promise.all([
    listMembers(),
    tab === "candidates" ? listCandidates() : Promise.resolve([]),
  ]);

  const activeMembers = members.filter((m) => m.status === "active").length;
  const suspendedMembers = members.filter((m) => m.status === "suspended").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminHeader
        title="Membres SOCAphy"
        subtitle="Gérez les membres du comité scientifique et les candidats"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Total" value={members.length} tone="emerald" />
        <StatBox label="Actifs" value={activeMembers} tone="emerald" />
        <StatBox label="Suspendus" value={suspendedMembers} tone="gray" />
        <StatBox
          label="Candidats"
          value={tab === "candidates" ? candidates.length : "—"}
          tone="orange"
        />
      </div>

      {/* Tabs + Add button */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Link
                key={t.key}
                href={`/adminDashboard/manageMembers?tab=${t.key}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <AddMemberModal />
      </div>

      {/* List */}
      {tab === "members" && (
        <>
          {members.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Aucun Membre SOCAphy"
              text="Ajoutez-en un ou promouvez un utilisateur depuis l'onglet candidats."
            />
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <MemberCard key={m._id} user={m} variant="member" />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "candidates" && (
        <>
          {candidates.length === 0 ? (
            <EmptyState
              icon="✨"
              title="Aucun candidat disponible"
              text="Les utilisateurs avec un rôle professionnel actif apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {candidates.map((c) => (
                <MemberCard key={c._id} user={c} variant="candidate" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
    gray: "bg-gray-50 text-gray-700 ring-gray-200",
  };
  return (
    <div className={`rounded-xl p-4 ring-1 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
      <p className="text-4xl">{icon}</p>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}