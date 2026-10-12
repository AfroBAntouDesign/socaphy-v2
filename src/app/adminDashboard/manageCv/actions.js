// src/app/adminDashboard/manageCv/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
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
  revalidatePath("/adminDashboard/manageCv");
  revalidatePath("/adminDashboard");
}

export async function approveCv(cvId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const cv = await Cv.findById(cvId);
  if (!cv) throw new Error("CV introuvable");
  if (cv.status !== "submitted") {
    throw new Error("Seuls les CV en attente peuvent être approuvés");
  }

  cv.status = "approved";
  cv.reviewedBy = session.sub;
  cv.reviewedAt = new Date();
  cv.rejectionReason = null;
  await cv.save();

  refresh();
  return { ok: true, message: "CV approuvé" };
}

export async function rejectCv(cvId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const cv = await Cv.findById(cvId);
  if (!cv) throw new Error("CV introuvable");
  if (cv.status !== "submitted") {
    throw new Error("Seuls les CV en attente peuvent être refusés");
  }

  const clean = (reason || "").trim();
  if (clean.length < 5) {
    throw new Error("Motif du refus trop court (min 5 caractères)");
  }

  cv.status = "rejected";
  cv.reviewedBy = session.sub;
  cv.reviewedAt = new Date();
  cv.rejectionReason = clean;
  await cv.save();

  refresh();
  return { ok: true, message: "CV refusé" };
}