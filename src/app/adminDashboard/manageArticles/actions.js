// src/app/adminDashboard/manageArticles/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/* ------------------------------------------------------------------ */

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
  revalidatePath("/adminDashboard/manageArticles");
  revalidatePath("/adminDashboard");
}

/* ------------------------------------------------------------------ */

export async function validateArticle(articleId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  if (article.status !== "submitted") {
    throw new Error("Seuls les articles soumis peuvent être validés");
  }

  article.status = "validated";
  article.validatedBy = session.sub;
  article.validatedAt = new Date();
  article.rejectionReason = null;
  await article.save();

  refresh();
  return { ok: true, message: "Article validé" };
}

export async function rejectArticle(articleId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  if (article.status !== "submitted") {
    throw new Error("Seuls les articles soumis peuvent être refusés");
  }

  const clean = (reason || "").trim();
  if (clean.length < 5) {
    throw new Error("Motif du refus trop court (min 5 caractères)");
  }

  article.status = "rejected";
  article.validatedBy = session.sub;
  article.validatedAt = new Date();
  article.rejectionReason = clean;
  await article.save();

  refresh();
  return { ok: true, message: "Article refusé" };
}