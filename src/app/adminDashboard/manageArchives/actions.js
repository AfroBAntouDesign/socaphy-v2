// src/app/adminDashboard/manageArchives/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
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

function refresh() {
  revalidatePath("/adminDashboard/manageArchives");
  revalidatePath("/adminDashboard/manageArticles");
  revalidatePath("/publicSpace");
  revalidatePath("/adminDashboard");
}

/**
 * Move a validated article into archives.
 * Archives = still in DB, but no longer visible on /publicSpace.
 */
export async function archiveArticle(articleId) {
  await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  if (article.status !== "validated") {
    throw new Error("Seuls les articles validés peuvent être archivés");
  }

  article.status = "archived";
  await article.save();

  refresh();
  return { ok: true, message: `"${article.title}" a été archivé` };
}

/**
 * Bring an archived article back to validated.
 */
export async function unarchiveArticle(articleId) {
  await requireSuperAdmin();
  await connectDB();

  const article = await Article.findById(articleId);
  if (!article) throw new Error("Article introuvable");

  if (article.status !== "archived") {
    throw new Error("Cet article n'est pas archivé");
  }

  article.status = "validated";
  await article.save();

  refresh();
  return { ok: true, message: `"${article.title}" a été restauré` };
}