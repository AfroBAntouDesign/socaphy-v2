// src/app/adminDashboard/manageCjp/partnership/page.js
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FaArrowLeft, FaGlobe, FaBook, FaUser, FaExchangeAlt, FaCheck,
} from "react-icons/fa";

import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  PublicSpaceSubmissionReview,
  CjpSubmissionReview,
  FeatureInPublicSpaceActions,
} from "./PartnershipActions";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function listPendingPublicSpace() {
  await connectDB();
  const docs = await Article.find({
    status: "validated",
    "partnership.publicSpaceSubmissionStatus": { $ne: "approved" },
  })
    .sort({ "partnership.publicSpaceSubmittedAt": -1, createdAt: -1 })
    .limit(50)
    .populate("user", "name role")
    .select("title kind abstract description partnership user")
    .lean();

  return docs.map((a) => ({
    _id: a._id.toString(),
    title: a.title,
    kind: a.kind,
    abstract: a.abstract || "",
    description: a.description || "",
    user: a.user ? { name: a.user.name || "", role: a.user.role || "" } : null,
    submittedAt: a.partnership?.publicSpaceSubmittedAt
      ? new Date(a.partnership.publicSpaceSubmittedAt).toISOString()
      : null,
  }));
}
async function listPendingCjp() {
  await connectDB();
  const docs = await Article.find({
    status: "validated",
    "partnership.cjpSubmissionStatus": { $ne: "approved" },
  })
    .sort({ "partnership.cjpSubmittedAt": -1, createdAt: -1 })
    .limit(50)
    .populate("user", "name role")
    .select("title kind abstract description partnership user")
    .lean();

  return docs.map((a) => ({
    _id: a._id.toString(),
    title: a.title,
    kind: a.kind,
    abstract: a.abstract || "",
    description: a.description || "",
    user: a.user ? { name: a.user.name || "", role: a.user.role || "" } : null,
    submittedAt: a.partnership?.cjpSubmittedAt
      ? new Date(a.partnership.cjpSubmittedAt).toISOString()
      : null,
  }));
}

async function listPublishableCjp() {
  await connectDB();
  const docs = await JournalArticle.find({
    status: "published",
    "partnership.publicArticle": { $in: [null, undefined] },
  })
    .sort({ publishedAt: -1 })
    .limit(50)
    .select("cjpId title section authors abstractFR abstractEN publishedAt")
    .lean();

  return docs.map((j) => ({
    _id: j._id.toString(),
    cjpId: j.cjpId || null,
    title: j.title,
    section: j.section || "",
    abstract: j.abstractFR || j.abstractEN || "",
    authors: (j.authors || []).slice(0, 4).map((a) => ({ name: a.name || "" })),
    publishedAt: j.publishedAt ? new Date(j.publishedAt).toISOString() : null,
    partnership: null,
  }));
}

async function listFeaturedCjp() {
  await connectDB();
  const docs = await JournalArticle.find({
    status: "published",
    "partnership.publicArticle": { $nin: [null, undefined] },
  })
    .sort({ "partnership.featuredInPublicSpaceAt": -1 })
    .limit(20)
    .select("cjpId title partnership")
    .lean();

  return docs.map((j) => ({
    _id: j._id.toString(),
    cjpId: j.cjpId || null,
    title: j.title,
    partnership: {
      publicArticle: j.partnership?.publicArticle
        ? j.partnership.publicArticle.toString()
        : null,
      featuredInPublicSpaceAt: j.partnership?.featuredInPublicSpaceAt
        ? new Date(j.partnership.featuredInPublicSpaceAt).toISOString()
        : null,
    },
  }));
}

export const metadata = {
  title: "Partenariat CJP | Admin",
};

export default async function PartnershipPage() {
  const session = await getSession();
  if (!session || session.role !== "superAdmin") redirect("/superadmin");

  const [pendingPublic, pendingCjp, publishable, featured] = await Promise.all([
    listPendingPublicSpace(),
    listPendingCjp(),
    listPublishableCjp(),
    listFeaturedCjp(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/adminDashboard/manageCjp"
        className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
      >
        <FaArrowLeft /> Journal CJP
      </Link>

      <AdminHeader
        title="Partenariat CJP ↔ Espace public"
        subtitle="Gérez les soumissions des deux côtés"
        action={{ href: "/adminDashboard", label: "← Tableau de bord" }}
      />

      <section className="mb-12">
        <SectionHeader
          icon={FaGlobe}
          title="Soumissions → Espace public"
          subtitle="Articles de la plateforme à publier sur la place publique"
          count={pendingPublic.length}
          tone="orange"
        />
        {pendingPublic.length === 0 ? (
          <EmptyCard icon="✅" text="Aucune soumission en attente" />
        ) : (
          <ul className="space-y-3">
            {pendingPublic.map((a) => (
              <li key={a._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <ArticleSummary article={a} />
                  <div className="shrink-0">
                    <PublicSpaceSubmissionReview article={{ _id: a._id, title: a.title }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <SectionHeader
          icon={FaExchangeAlt}
          title="Soumissions → CJP"
          subtitle="Articles validés à publier dans le journal scientifique"
          count={pendingCjp.length}
          tone="orange"
        />
        {pendingCjp.length === 0 ? (
          <EmptyCard icon="✅" text="Aucune soumission CJP en attente" />
        ) : (
          <ul className="space-y-3">
            {pendingCjp.map((a) => (
              <li key={a._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <ArticleSummary article={a} />
                  <div className="shrink-0">
                    <CjpSubmissionReview article={{ _id: a._id, title: a.title }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <SectionHeader
          icon={FaGlobe}
          title="Publications CJP → Espace public"
          subtitle="Articles publiés au journal à mettre en avant sur la plateforme"
          count={publishable.length}
          tone="emerald"
        />
        {publishable.length === 0 ? (
          <EmptyCard icon="📚" text="Aucun article CJP en attente" />
        ) : (
          <ul className="space-y-3">
            {publishable.map((j) => (
              <li key={j._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <JournalSummary journal={j} />
                  <div className="shrink-0">
                    <FeatureInPublicSpaceActions
                      journalArticle={{
                        _id: j._id,
                        cjpId: j.cjpId,
                        title: j.title,
                        partnership: null,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {featured.length > 0 && (
        <section>
          <SectionHeader
            icon={FaCheck}
            title="Déjà publiés dans l'espace public"
            subtitle="Articles CJP visibles sur /publicSpace"
            count={featured.length}
            tone="gray"
          />
          <ul className="space-y-2">
            {featured.map((j) => (
              <li
                key={j._id}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {j.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {j.cjpId} ·{" "}
                    {j.partnership?.featuredInPublicSpaceAt &&
                      new Date(j.partnership.featuredInPublicSpaceAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="shrink-0">
                  <FeatureInPublicSpaceActions
                    journalArticle={{
                      _id: j._id,
                      cjpId: j.cjpId,
                      title: j.title,
                      partnership: j.partnership,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, count, tone }) {
  const tones = {
    emerald: "bg-emerald-600",
    orange: "bg-orange-500",
    gray: "bg-gray-500",
  };
  const pills = {
    emerald: "bg-emerald-100 text-emerald-800",
    orange: "bg-orange-100 text-orange-800",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]} text-white`}>
        <Icon />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${pills[tone]}`}>
        {count} en attente
      </span>
    </div>
  );
}

function EmptyCard({ icon, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <p className="text-2xl">{icon}</p>
      <p className="mt-2 text-sm font-medium text-gray-700">{text}</p>
    </div>
  );
}

function ArticleSummary({ article }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
          En attente
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {article.kind === "scientific" ? "Scientifique" : "Pratique"}
        </span>
      </div>
      <h3 className="mt-2 font-serif text-base font-bold text-gray-900">
        {article.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
        {article.abstract || article.description || "—"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <FaUser className="opacity-60" />
          <strong className="text-gray-700">{article.user?.name || "—"}</strong>{" "}
          ({ROLE_LABELS[article.user?.role] || article.user?.role || "—"})
        </span>
      </div>
    </div>
  );
}

function JournalSummary({ journal }) {
  const names = (journal.authors || []).map((a) => a.name).join(", ");
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          Publié CJP
        </span>
        {journal.cjpId && (
          <span className="font-mono text-xs text-gray-400">{journal.cjpId}</span>
        )}
      </div>
      <h3 className="mt-2 font-serif text-base font-bold text-gray-900">
        <Link
          href={`/cjp/articles/${journal._id}`}
          target="_blank"
          className="inline-flex items-center gap-2 hover:text-emerald-700 hover:underline"
        >
          <FaBook className="text-xs" />
          {journal.title}
        </Link>
      </h3>
      {names && <p className="mt-1 text-xs text-gray-600">{names}</p>}
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
        {journal.abstract || "—"}
      </p>
    </div>
  );
}
