// src/app/adminDashboard/manageMembers/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME, hashPassword } from "@/lib/auth";
import { OPEN_REGISTER_ROLES } from "@/lib/roles";

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
  revalidatePath("/adminDashboard/manageMembers");
  revalidatePath("/adminDashboard/manageUsers");
  revalidatePath("/adminDashboard");
}

/* ------------------------------------------------------------------ */
/*  CREATE — new Membre SOCAphy directly                                */
/* ------------------------------------------------------------------ */

export async function createMember({ name, email, password }) {
  const session = await requireSuperAdmin();

  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPwd = password || "";

  if (cleanName.length < 2) throw new Error("Nom trop court");
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error("Email invalide");
  if (cleanPwd.length < 8)
    throw new Error("Mot de passe : 8 caractères minimum");
  if (!/[A-Za-z]/.test(cleanPwd) || !/[0-9]/.test(cleanPwd))
    throw new Error("Mot de passe : doit contenir lettre et chiffre");

  await connectDB();

  if (await User.findOne({ email: cleanEmail })) {
    throw new Error("Cet email est déjà utilisé");
  }

  const hashed = await hashPassword(cleanPwd);

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    password: hashed,
    role: "adminSOCAphy",
    status: "active",
    verified: true,
    verifiedBy: session.sub,
    verifiedAt: new Date(),
  });

  refresh();
  return {
    ok: true,
    message: `${user.name} a été ajouté comme Membre SOCAphy`,
    userId: user._id.toString(),
  };
}

/* ------------------------------------------------------------------ */
/*  PROMOTE — any active user becomes adminSOCAphy                      */
/* ------------------------------------------------------------------ */

export async function promoteToMember(userId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  if (user._id.toString() === session.sub)
    throw new Error("Impossible de modifier votre propre rôle");

  if (user.role === "adminSOCAphy")
    throw new Error("Cet utilisateur est déjà Membre SOCAphy");

  if (user.role === "superAdmin")
    throw new Error("Impossible de modifier un Super Administrateur");

  user.role = "adminSOCAphy";
  user.status = "active";
  user.verified = true;
  user.verifiedBy = session.sub;
  user.verifiedAt = new Date();
  user.rejectionReason = null;
  await user.save();

  refresh();
  return { ok: true, message: `${user.name} est maintenant Membre SOCAphy` };
}

/* ------------------------------------------------------------------ */
/*  DEMOTE — adminSOCAphy becomes a lesser role                         */
/* ------------------------------------------------------------------ */

export async function demoteMember(userId, newRole) {
  const session = await requireSuperAdmin();

  if (!OPEN_REGISTER_ROLES.includes(newRole)) {
    throw new Error("Rôle cible invalide");
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  if (user._id.toString() === session.sub)
    throw new Error("Impossible de modifier votre propre rôle");

  if (user.role !== "adminSOCAphy")
    throw new Error("Cet utilisateur n'est pas Membre SOCAphy");

  user.role = newRole;
  await user.save();

  refresh();
  return {
    ok: true,
    message: `${user.name} est maintenant ${newRole}`,
  };
}

/* ------------------------------------------------------------------ */
/*  SUSPEND                                                             */
/* ------------------------------------------------------------------ */

export async function suspendMember(userId, reason) {
  const session = await requireSuperAdmin();
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  if (user._id.toString() === session.sub)
    throw new Error("Impossible de vous suspendre vous-même");

  user.status = "suspended";
  user.verified = false;
  user.rejectionReason =
    (reason || "").trim() || "Compte suspendu par l'administration.";
  await user.save();

  refresh();
  return { ok: true, message: `${user.name} a été suspendu` };
}

/* ------------------------------------------------------------------ */
/*  REACTIVATE                                                          */
/* ------------------------------------------------------------------ */

export async function reactivateMember(userId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  user.status = "active";
  user.verified = true;
  user.verifiedBy = session.sub;
  user.verifiedAt = new Date();
  user.rejectionReason = null;
  await user.save();

  refresh();
  return { ok: true, message: `${user.name} a été réactivé` };
}

/* ------------------------------------------------------------------ */
/*  DELETE — hard delete + cleanup                                      */
/* ------------------------------------------------------------------ */

export async function deleteMember(userId) {
  const session = await requireSuperAdmin();
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  if (user._id.toString() === session.sub)
    throw new Error("Impossible de supprimer votre propre compte");

  if (user.role === "superAdmin")
    throw new Error("Impossible de supprimer un Super Administrateur");

  const name = user.name;
  await user.deleteOne();

  refresh();
  return { ok: true, message: `${name} a été supprimé définitivement` };
}