// src/app/adminDashboard/manageCjp/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import JournalInfo from "@/models/JournalInfo";
import JournalBoardMember from "@/models/JournalBoardMember";
import JournalIssue from "@/models/JournalIssue";
import JournalArticle from "@/models/JournalArticle";
import JournalReport from "@/models/JournalReport";
import JournalComment from "@/models/JournalComment";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function requireSuperAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "superAdmin") {
    throw new Error("Non autorisé");
  }
  return session;
}

function refreshAll() {
  revalidatePath("/adminDashboard/manageCjp");
  revalidatePath("/adminDashboard/manageCjp/info");
  revalidatePath("/adminDashboard/manageCjp/board");
  revalidatePath("/adminDashboard/manageCjp/issues");
  revalidatePath("/adminDashboard/manageCjp/submissions");
  revalidatePath("/adminDashboard/manageCjp/reports");
  revalidatePath("/cjp");
  revalidatePath("/cjp/about");
  revalidatePath("/cjp/editorial-board");
  revalidatePath("/cjp/instructions");
  revalidatePath("/cjp/articles");
}

/* ══════════════════════════════════════════════════════════════════ */
/*  JOURNAL INFO                                                     */
/* ══════════════════════════════════════════════════════════════════ */

export async function updateJournalInfo(data) {
  await requireSuperAdmin();
  await connectDB();

  const allowed = [
    "shortName", "name", "tagline", "issn", "eissn", "frequency",
    "publisher", "foundedYear",
    "descriptionFR", "descriptionEN",
    "scopeFR", "scopeEN",
    "ethicsFR", "ethicsEN",
    "instructionsFR", "instructionsEN",
    "contactEmail", "contactPhone", "contactAddress",
    "contactCity", "contactCountry",
    "coverImage", "logo",
    "openAccess", "peerReviewed", "apc",
    "website", "twitter", "linkedin",
  ];

  const update = {};
  for (const k of allowed) {
    if (k in data) update[k] = data[k];
  }

  await JournalInfo.findOneAndUpdate(
    { _key: "singleton" },
    { $set: update },
    { upsert: true, new: true }
  );

  refreshAll();
  return { ok: true, message: "Informations du journal mises à jour" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  BOARD MEMBERS                                                    */
/* ══════════════════════════════════════════════════════════════════ */

export async function createBoardMember(data) {
  await requireSuperAdmin();
  await connectDB();

  if (!data.name?.trim()) throw new Error("Nom requis");
  if (!data.role) throw new Error("Rôle requis");

  const member = await JournalBoardMember.create({
    name: data.name.trim(),
    title: data.title?.trim() || "",
    role: data.role,
    affiliation: data.affiliation?.trim() || "",
    email: data.email?.trim() || "",
    orcid: data.orcid?.trim() || "",
    photo: data.photo || "",
    biography: data.biography?.trim() || "",
    order: Number.isFinite(data.order) ? data.order : 0,
    isActive: true,
  });

  refreshAll();
  return { ok: true, message: `${member.name} ajouté`, id: member._id.toString() };
}

export async function updateBoardMember(id, data) {
  await requireSuperAdmin();
  await connectDB();

  const allowed = [
    "name", "title", "role", "affiliation", "email",
    "orcid", "photo", "biography", "order", "isActive",
  ];
  const update = {};
  for (const k of allowed) {
    if (k in data) update[k] = data[k];
  }

  await JournalBoardMember.findByIdAndUpdate(id, { $set: update });
  refreshAll();
  return { ok: true, message: "Membre mis à jour" };
}

export async function deleteBoardMember(id) {
  await requireSuperAdmin();
  await connectDB();
  await JournalBoardMember.findByIdAndDelete(id);
  refreshAll();
  return { ok: true, message: "Membre supprimé" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  ISSUES                                                           */
/* ══════════════════════════════════════════════════════════════════ */

export async function createIssue(data) {
  await requireSuperAdmin();
  await connectDB();

  const volume = Number(data.volume);
  const number = Number(data.number);
  const year = Number(data.year);

  if (!Number.isInteger(volume) || volume < 1) throw new Error("Volume invalide");
  if (!Number.isInteger(number) || number < 1) throw new Error("Numéro invalide");
  if (!Number.isInteger(year) || year < 2000) throw new Error("Année invalide");

  const existing = await JournalIssue.findOne({ volume, number });
  if (existing) throw new Error(`Vol. ${volume}, No. ${number} existe déjà`);

  const slug = `vol-${volume}-no-${number}`;

  const issue = await JournalIssue.create({
    volume,
    number,
    year,
    title: data.title?.trim() || "",
    editorial: data.editorial?.trim() || "",
    slug,
    publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
    coverImage: data.coverImage || "",
    status: data.status || "upcoming",
  });

  refreshAll();
  return { ok: true, message: `Vol. ${volume}, No. ${number} créé`, id: issue._id.toString() };
}

export async function updateIssue(id, data) {
  await requireSuperAdmin();
  await connectDB();

  const allowed = ["title", "editorial", "publishDate", "coverImage", "status"];
  const update = {};
  for (const k of allowed) {
    if (k in data) {
      update[k] = k === "publishDate" && data[k] ? new Date(data[k]) : data[k];
    }
  }

  await JournalIssue.findByIdAndUpdate(id, { $set: update });
  refreshAll();
  return { ok: true, message: "Numéro mis à jour" };
}

export async function deleteIssue(id) {
  await requireSuperAdmin();
  await connectDB();

  const articleCount = await JournalArticle.countDocuments({ issue: id });
  if (articleCount > 0) {
    throw new Error(
      `Impossible de supprimer : ${articleCount} article(s) sont liés à ce numéro`
    );
  }

  await JournalIssue.findByIdAndDelete(id);
  refreshAll();
  return { ok: true, message: "Numéro supprimé" };
}

export async function setCurrentIssue(id) {
  await requireSuperAdmin();
  await connectDB();

  // Unset previous current
  await JournalIssue.updateMany(
    { status: "current" },
    { $set: { status: "archived" } }
  );

  await JournalIssue.findByIdAndUpdate(id, { $set: { status: "current" } });
  refreshAll();
  return { ok: true, message: "Numéro en cours mis à jour" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  ARTICLE VALIDATION                                               */
/* ══════════════════════════════════════════════════════════════════ */

export async function acceptArticle(id) {
  await requireSuperAdmin();
  await connectDB();

  const article = await JournalArticle.findById(id);
  if (!article) throw new Error("Article introuvable");
  if (article.status !== "submitted" && article.status !== "under_review") {
    throw new Error("Seuls les articles soumis ou en évaluation peuvent être acceptés");
  }

  article.status = "accepted";
  article.reviewedAt = new Date();
  article.rejectionReason = null;
  await article.save();

  refreshAll();
  return { ok: true, message: "Article accepté" };
}

export async function rejectArticle(id, reason) {
  await requireSuperAdmin();
  await connectDB();

  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif requis (min 5 caractères)");

  const article = await JournalArticle.findById(id);
  if (!article) throw new Error("Article introuvable");

  article.status = "rejected";
  article.rejectionReason = clean;
  article.reviewedAt = new Date();
  await article.save();

  refreshAll();
  return { ok: true, message: "Article refusé" };
}

export async function publishArticle(id, issueId) {
  await requireSuperAdmin();
  await connectDB();

  const article = await JournalArticle.findById(id);
  if (!article) throw new Error("Article introuvable");
  if (article.status !== "accepted") {
    throw new Error("Seuls les articles acceptés peuvent être publiés");
  }

  // Validate issue if provided
  let issueRef = null;
  if (issueId) {
    const issue = await JournalIssue.findById(issueId);
    if (!issue) throw new Error("Numéro introuvable");
    issueRef = issue._id;
  }

  article.status = "published";
  article.publishedAt = new Date();
  if (issueRef) article.issue = issueRef;
  await article.save();

  // Update issue counter
  if (issueRef) {
    const count = await JournalArticle.countDocuments({
      issue: issueRef,
      status: "published",
    });
    await JournalIssue.updateOne({ _id: issueRef }, { $set: { articleCount: count } });
  }

  refreshAll();
  return {
    ok: true,
    message: `Article publié${issueRef ? " dans le numéro sélectionné" : ""}`,
  };
}

export async function withdrawArticle(id, reason) {
  await requireSuperAdmin();
  await connectDB();

  const article = await JournalArticle.findById(id);
  if (!article) throw new Error("Article introuvable");

  article.status = "withdrawn";
  article.rejectionReason = (reason || "").trim() || "Retiré par l'administration";
  await article.save();

  refreshAll();
  return { ok: true, message: "Article retiré" };
}

export async function assignArticleToIssue(articleId, issueId) {
  await requireSuperAdmin();
  await connectDB();

  const article = await JournalArticle.findById(articleId);
  if (!article) throw new Error("Article introuvable");
  if (article.status !== "published") {
    throw new Error("Assignez d'abord la publication");
  }

  if (issueId) {
    const issue = await JournalIssue.findById(issueId);
    if (!issue) throw new Error("Numéro introuvable");
  }

  article.issue = issueId || null;
  await article.save();

  // Recount all issues
  const issues = await JournalIssue.find();
  for (const issue of issues) {
    const count = await JournalArticle.countDocuments({
      issue: issue._id,
      status: "published",
    });
    await JournalIssue.updateOne({ _id: issue._id }, { $set: { articleCount: count } });
  }

  refreshAll();
  return { ok: true, message: "Article assigné" };
}

/* ══════════════════════════════════════════════════════════════════ */
/*  REPORTS MODERATION                                               */
/* ══════════════════════════════════════════════════════════════════ */

export async function dismissReport(id, note) {
  const session = await requireSuperAdmin();
  await connectDB();

  await JournalReport.findByIdAndUpdate(id, {
    $set: {
      status: "dismissed",
      resolutionNote: (note || "").trim() || "Signalement non fondé",
      reviewedBy: session.sub,
      reviewedAt: new Date(),
    },
  });

  refreshAll();
  return { ok: true, message: "Signalement classé" };
}

export async function takeActionOnReport(id, action, note) {
  const session = await requireSuperAdmin();
  await connectDB();

  const clean = (action || "").trim();
  if (clean.length < 5) throw new Error("Action requise (min 5 caractères)");

  const report = await JournalReport.findById(id);
  if (!report) throw new Error("Signalement introuvable");

  report.status = "action_taken";
  report.actionTaken = clean;
  report.resolutionNote = (note || "").trim();
  report.reviewedBy = session.sub;
  report.reviewedAt = new Date();
  await report.save();

  // If linked to a comment, hide it
  if (report.comment) {
    await JournalComment.findByIdAndUpdate(report.comment, {
      $set: { status: "hidden" },
    });
  }

  refreshAll();
  return { ok: true, message: "Action enregistrée" };
}

export async function markReportReviewed(id) {
  const session = await requireSuperAdmin();
  await connectDB();

  await JournalReport.findByIdAndUpdate(id, {
    $set: {
      status: "reviewed",
      reviewedBy: session.sub,
      reviewedAt: new Date(),
    },
  });

  refreshAll();
  return { ok: true, message: "Signalement marqué comme examiné" };
}
