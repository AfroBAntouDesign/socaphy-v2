// src/app/users/communaute/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaUsers, FaPlus, FaSearch, FaGlobe, FaLock, FaUserPlus,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { key: "all", label: "Toutes" },
  { key: "treatment", label: "Traitements" },
  { key: "practice", label: "Pratiques" },
  { key: "product", label: "Produits" },
  { key: "academic", label: "Recherche" },
  { key: "other", label: "Autres" },
];

const CATEGORY_LABEL = {
  treatment: "Traitement",
  practice: "Pratique",
  product: "Produits",
  academic: "Recherche",
  other: "Autre",
};

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function listCommunities({ category, q, userId }) {
  await connectDB();

  const query = { status: "active" };
  if (category && category !== "all") query.category = category;
  if (q) query.$text = { $search: q };

  const communities = await Community.find(query)
    .sort({ memberCount: -1, createdAt: -1 })
    .limit(60)
    .select("name description theme category avatar coverImage memberCount postCount members")
    .lean();

  return communities.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    description: c.description,
    theme: c.theme,
    category: c.category,
    avatar: c.avatar,
    coverImage: c.coverImage,
    memberCount: c.memberCount || 0,
    postCount: c.postCount || 0,
    isMember: userId
      ? (c.members || []).some((m) => m.toString() === userId)
      : false,
  }));
}

async function listMyCommunities(userId) {
  await connectDB();
  const communities = await Community.find({
    $or: [{ creator: userId }, { members: userId }],
    status: { $in: ["pending", "active"] },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("name status memberCount category")
    .lean();

  return communities.map((c) => ({ ...c, _id: c._id.toString() }));
}

/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Communauté | SOCAphy",
  description: "Espaces d'échange autour de la médecine traditionnelle camerounaise.",
};

export default async function CommunautePage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/users/communaute");

  const params = await searchParams;
  const category = CATEGORIES.some((c) => c.key === params?.category)
    ? params.category
    : "all";
  const q = (params?.q || "").trim();

  const [communities, myCommunities] = await Promise.all([
    listCommunities({ category, q, userId: session.sub }),
    listMyCommunities(session.sub),
  ]);

  const buildHref = (categoryKey) => {
    const p = new URLSearchParams();
    if (categoryKey !== "all") p.set("category", categoryKey);
    if (q) p.set("q", q);
    return `/users/communaute${p.toString() ? "?" + p : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Communauté SOCAphy
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Espaces d'échange
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Rejoignez ou créez des communautés autour de la médecine traditionnelle.
          </p>
        </div>

        <Link
          href="/users/communaute/nouveau"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaPlus /> Créer une communauté
        </Link>
      </div>

      {/* My communities (pending/active) */}
      {myCommunities.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Mes communautés ({myCommunities.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {myCommunities.map((c) => (
              <Link
                key={c._id}
                href={`/users/communaute/${c._id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="truncate">{c.name}</span>
                {c.status === "pending" && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-orange-200">
                    En attente
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search + category filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <Link
                key={c.key}
                href={buildHref(c.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" className="flex w-full items-center gap-2 sm:w-auto">
          {category !== "all" && (
            <input type="hidden" name="category" value={category} />
          )}
          <div className="relative flex-1 sm:w-64">
            <FaSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Chercher
          </button>
        </form>
      </div>

      {/* List */}
      {communities.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">💬</p>
          <h3 className="mt-3 font-semibold text-gray-900">
            {q ? "Aucun résultat" : "Aucune communauté pour le moment"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {q
              ? "Essayez d'autres mots-clés."
              : "Soyez le premier à en créer une."}
          </p>
          {!q && (
            <Link
              href="/users/communaute/nouveau"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <FaPlus /> Créer
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <CommunityCard key={c._id} community={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CommunityCard({ community }) {
  return (
    <Link
      href={`/users/communaute/${community._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700">
        {community.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={community.coverImage}
            alt=""
            className="h-full w-full object-cover opacity-70"
          />
        )}
        <div className="absolute top-3 right-3">
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 backdrop-blur">
            {CATEGORY_LABEL[community.category] || "Autre"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-semibold text-gray-900 group-hover:text-emerald-800">
          {community.name}
        </h3>
        {community.theme && (
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-emerald-700">
            {community.theme}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
          {community.description}
        </p>

        <div className="mt-4 flex flex-1 items-end justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <FaUsers className="opacity-60" />
            {community.memberCount} membre
            {community.memberCount > 1 ? "s" : ""}
          </span>
          {community.isMember ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              ✓ Membre
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <FaUserPlus /> Rejoindre
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}