// src/app/adminDashboard/manageCommunity/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
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
  revalidatePath("/adminDashboard/manageCommunity");
  revalidatePath("/users/communaute");
  revalidatePath("/adminDashboard");
}

export async function approveCommunity(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const c = await Community.findById(id);
  if (!c) throw new Error("Communauté introuvable");
  if (c.status !== "pending") throw new Error("Cette communauté n'est pas en attente");

  c.status = "active";
  c.reviewedBy = session.sub;
  c.reviewedAt = new Date();
  c.rejectionReason = null;
  await c.save();

  refresh();
  return { ok: true, message: `"${c.name}" a été validée` };
}

export async function rejectCommunity(id, reason) {
  const session = await requireSuperAdmin();
  await connectDB();
  const c = await Community.findById(id);
  if (!c) throw new Error("Communauté introuvable");
  if (c.status !== "pending") throw new Error("Cette communauté n'est pas en attente");

  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif trop court (min 5 caractères)");

  c.status = "rejected";
  c.reviewedBy = session.sub;
  c.reviewedAt = new Date();
  c.rejectionReason = clean;
  await c.save();

  refresh();
  return { ok: true, message: `"${c.name}" a été refusée` };
}

export async function archiveCommunity(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const c = await Community.findById(id);
  if (!c) throw new Error("Communauté introuvable");

  c.status = "archived";
  c.reviewedBy = session.sub;
  c.reviewedAt = new Date();
  await c.save();

  refresh();
  return { ok: true, message: `"${c.name}" a été archivée` };
}

export async function reactivateCommunity(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const c = await Community.findById(id);
  if (!c) throw new Error("Communauté introuvable");

  c.status = "active";
  c.reviewedBy = session.sub;
  c.reviewedAt = new Date();
  c.rejectionReason = null;
  await c.save();

  refresh();
  return { ok: true, message: `"${c.name}" a été réactivée` };
}