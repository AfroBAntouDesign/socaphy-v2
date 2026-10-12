// src/app/adminDashboard/manageUsers/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/*  Guard — every action re-verifies the caller is superAdmin          */
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

/* Revalidate the pages that display user data */
function refresh() {
  revalidatePath("/adminDashboard/manageUsers");
  revalidatePath("/adminDashboard");
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export async function approveUser(userId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const target = await User.findById(userId);
  if (!target) throw new Error("Utilisateur introuvable");

  // Prevent acting on yourself
  if (target._id.toString() === session.sub) {
    throw new Error("Impossible de modifier votre propre compte");
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      status: "active",
      verified: true,
      verifiedBy: session.sub,
      verifiedAt: new Date(),
      rejectionReason: null,
    },
  });

  refresh();
  return { ok: true, message: `${target.name} a été activé` };
}

export async function rejectUser(userId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const target = await User.findById(userId);
  if (!target) throw new Error("Utilisateur introuvable");

  if (target._id.toString() === session.sub) {
    throw new Error("Impossible de modifier votre propre compte");
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      status: "rejected",
      verified: false,
      verifiedBy: session.sub,
      verifiedAt: new Date(),
      rejectionReason: (reason || "").trim() || "Demande refusée par l'administration.",
    },
  });

  refresh();
  return { ok: true, message: `${target.name} a été refusé` };
}

export async function suspendUser(userId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const target = await User.findById(userId);
  if (!target) throw new Error("Utilisateur introuvable");

  if (target._id.toString() === session.sub) {
    throw new Error("Impossible de modifier votre propre compte");
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      status: "suspended",
      verified: false,
      rejectionReason: (reason || "").trim() || "Compte suspendu par l'administration.",
    },
  });

  refresh();
  return { ok: true, message: `${target.name} a été suspendu` };
}

export async function reactivateUser(userId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const target = await User.findById(userId);
  if (!target) throw new Error("Utilisateur introuvable");

  await User.findByIdAndUpdate(userId, {
    $set: {
      status: "active",
      verified: true,
      verifiedBy: session.sub,
      verifiedAt: new Date(),
      rejectionReason: null,
    },
  });

  refresh();
  return { ok: true, message: `${target.name} a été réactivé` };
}