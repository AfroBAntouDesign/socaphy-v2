// src/app/adminDashboard/manageCjp/partnership/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import {
  articleToJournalPayload,
  journalToArticlePayload,
} from "@/lib/partnership";

async function requireSuperAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "superAdmin") {
    throw new Error("Non autorisé");
  }
  return session;
}

function refresh() {
  revalidatePath("/adminDashboard/manageCjp/partnership");
  revalidatePath("/adminDashboard/manageCjp");
  revalidatePath("/adminDashboard/manageCjp/submissions");
  revalidatePath("/adminDashboard/manageArticles");
  revalidatePath("/adminDashboard");
  revalidatePath("/cjp");
  revalidatePath("/cjp/articles");
  revalidatePath("/publicSpace");
}

/* ══════════════════════════════════════════════════════════════════ */
/*  FLUX 1a : Article → Espace public                                 */
/* ══════════════════════════════════════════════════════════════════ */

export async function approvePublicSpaceSubmission(articleId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  // Pas de vérification stricte : la page admin EST la file d'attente.
  // On approuve dès que possible, sauf si déjà approuvé.

  if (!article.partnership) article.partnership = {};
  article.partnership.publicSpaceSubmissionStatus = "approved";
  article.partnership.publicSpaceDecidedAt = new Date();
  article.partnership.publicSpaceDecidedBy = session.sub;
  article.partnership.publicSpaceRefusalReason = null;
  await article.save();

  refresh();
  return { ok: true, message: "Article publié dans l'espace public" };
}

export async function refusePublicSpaceSubmission(articleId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif requis (min 5 caractères)");

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  article.partnership.publicSpaceSubmissionStatus = "refused";
  article.partnership.publicSpaceRefusalReason = clean;
  article.partnership.publicSpaceDecidedAt = new Date();
  article.partnership.publicSpaceDecidedBy = session.sub;
  await article.save();

  refresh();
  return { ok: true, message: "Soumission refusée" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  FLUX 1b : Article → CJP                                           */
/* ══════════════════════════════════════════════════════════════════ */

export async function approveCjpSubmission(articleId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  if (article.status !== "validated") {
    throw new Error("Seuls les articles validés peuvent être publiés au CJP");
  }

  // Pas de vérification stricte de partnership.cjpSubmissionStatus.

  const year = new Date().getFullYear();
  const prefix = `CJP-${year}-`;
  const last = await JournalArticle.findOne({ cjpId: new RegExp(`^${prefix}`) })
    .sort({ cjpId: -1 })
    .select("cjpId")
    .lean();
  const nextSeq = last ? parseInt(last.cjpId.slice(-4), 10) + 1 : 1;
  const cjpId = `CJP-${year}-${String(nextSeq).padStart(4, "0")}`;

  const jPayload = articleToJournalPayload(article, session.sub);
  const journalArticle = await JournalArticle.create({
    ...jPayload,
    cjpId,
    submittedBy: article.user,
    status: "published",       // ⬅️ DIRECTEMENT PUBLIÉ
    publishedAt: new Date(),   // ⬅️ POUR QU'IL APPARAISSE SUR /cjp/articles
    submittedAt: new Date(),
    reviewedBy: session.sub,
    reviewedAt: new Date(),
  });

  if (!article.partnership) article.partnership = {};
  article.partnership.cjpSubmissionStatus = "approved";
  article.partnership.cjpArticle = journalArticle._id;
  article.partnership.cjpDecidedAt = new Date();
  article.partnership.cjpDecidedBy = session.sub;
  article.partnership.cjpRefusalReason = null;
  await article.save();

  refresh();
  return {
    ok: true,
    message: `Article publié au CJP sous ${journalArticle.cjpId}`,
    cjpId: journalArticle.cjpId,
  };
}

export async function refuseCjpSubmission(articleId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif requis (min 5 caractères)");

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  article.partnership.cjpSubmissionStatus = "refused";
  article.partnership.cjpRefusalReason = clean;
  article.partnership.cjpDecidedAt = new Date();
  article.partnership.cjpDecidedBy = session.sub;
  await article.save();

  refresh();
  return { ok: true, message: "Soumission refusée" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  FLUX 2 : CJP → Espace public                                     */
/* ══════════════════════════════════════════════════════════════════ */

export async function featureCjpInPublicSpace(journalArticleId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const j = await JournalArticle.findById(journalArticleId);
  if (!j) throw new Error("Article CJP introuvable");
  if (j.status !== "published") {
    throw new Error("Seuls les articles publiés au CJP peuvent être mis en avant");
  }

  // Idempotence
  if (j.partnership?.publicArticle) {
    return { ok: true, message: "Article déjà présent dans l'espace public" };
  }

  const aPayload = journalToArticlePayload(j);
  const article = await Article.create({
    ...aPayload,
    user: j.submittedBy,
    profileType: "adminSOCAphy",
    status: "validated",
    validatedBy: session.sub,
    validatedAt: new Date(),
    partnership: {
      publicSpaceSubmissionStatus: "approved",
      publicSpaceDecidedAt: new Date(),
      publicSpaceDecidedBy: session.sub,
      sourceJournalArticle: j._id,
      sourcedFromCjpAt: new Date(),
    },
  });

  j.partnership = j.partnership || {};
  j.partnership.publicArticle = article._id;
  j.partnership.featuredInPublicSpaceAt = new Date();
  j.partnership.featuredInPublicSpaceBy = session.sub;
  await j.save();

  refresh();
  return {
    ok: true,
    message: `Article ${j.cjpId} publié dans l'espace public`,
  };
}

export async function unfeatureCjpFromPublicSpace(journalArticleId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const j = await JournalArticle.findById(journalArticleId);
  if (!j) throw new Error("Article CJP introuvable");
  if (!j.partnership?.publicArticle) {
    throw new Error("Cet article n'est pas dans l'espace public");
  }

  await Article.updateOne(
    { _id: j.partnership.publicArticle },
    { $set: { status: "archived", rejectionReason: "Retiré de l'espace public" } }
  );

  j.partnership.publicArticle = null;
  j.partnership.featuredInPublicSpaceAt = null;
  j.partnership.featuredInPublicSpaceBy = null;
  await j.save();

  refresh();
  return { ok: true, message: "Retiré de l'espace public" };
}
