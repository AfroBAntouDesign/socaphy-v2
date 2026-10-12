// src/app/adminDashboard/manageShops/actions.js
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function requireSuperAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session || session.role !== "superAdmin") throw new Error("Non autorisé");
  return session;
}

function refresh() {
  revalidatePath("/adminDashboard/manageShops");
  revalidatePath("/market");
  revalidatePath("/adminDashboard");
}

/* ── Shop actions ─────────────────────────────────────────────── */

export async function approveShop(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const s = await Shop.findById(id);
  if (!s) throw new Error("Boutique introuvable");
  if (s.status !== "pending") throw new Error("Cette boutique n'est pas en attente");
  s.status = "active";
  s.reviewedBy = session.sub;
  s.reviewedAt = new Date();
  s.rejectionReason = null;
  await s.save();
  refresh();
  return { ok: true, message: `"${s.name}" est maintenant active` };
}

export async function rejectShop(id, reason) {
  const session = await requireSuperAdmin();
  await connectDB();
  const s = await Shop.findById(id);
  if (!s) throw new Error("Boutique introuvable");
  if (s.status !== "pending") throw new Error("Cette boutique n'est pas en attente");
  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif trop court (min 5)");
  s.status = "rejected";
  s.reviewedBy = session.sub;
  s.reviewedAt = new Date();
  s.rejectionReason = clean;
  await s.save();
  refresh();
  return { ok: true, message: `"${s.name}" a été refusée` };
}

export async function suspendShop(id, reason) {
  const session = await requireSuperAdmin();
  await connectDB();
  const s = await Shop.findById(id);
  if (!s) throw new Error("Boutique introuvable");
  s.status = "suspended";
  s.reviewedBy = session.sub;
  s.reviewedAt = new Date();
  s.rejectionReason = (reason || "").trim() || "Boutique suspendue.";
  await s.save();
  refresh();
  return { ok: true, message: `"${s.name}" a été suspendue` };
}

export async function reactivateShop(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const s = await Shop.findById(id);
  if (!s) throw new Error("Boutique introuvable");
  s.status = "active";
  s.reviewedBy = session.sub;
  s.reviewedAt = new Date();
  s.rejectionReason = null;
  await s.save();
  refresh();
  return { ok: true, message: `"${s.name}" a été réactivée` };
}

/* ── Product actions ──────────────────────────────────────────── */

export async function approveProduct(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const p = await Product.findById(id);
  if (!p) throw new Error("Produit introuvable");
  if (p.status !== "pending") throw new Error("Ce produit n'est pas en attente");

  p.status = "active";
  p.reviewedBy = session.sub;
  p.reviewedAt = new Date();
  p.rejectionReason = null;
  await p.save();

  // Update shop counter
  const shop = await Shop.findById(p.shop);
  if (shop) {
    shop.activeProductCount = (shop.activeProductCount || 0) + 1;
    await shop.save();
  }

  refresh();
  return { ok: true, message: `"${p.name}" est maintenant en vente` };
}

export async function rejectProduct(id, reason) {
  const session = await requireSuperAdmin();
  await connectDB();
  const p = await Product.findById(id);
  if (!p) throw new Error("Produit introuvable");
  if (p.status !== "pending") throw new Error("Ce produit n'est pas en attente");

  const clean = (reason || "").trim();
  if (clean.length < 5) throw new Error("Motif trop court (min 5)");

  const wasActive = p.status === "active";
  p.status = "rejected";
  p.reviewedBy = session.sub;
  p.reviewedAt = new Date();
  p.rejectionReason = clean;
  await p.save();

  if (wasActive) {
    const shop = await Shop.findById(p.shop);
    if (shop) {
      shop.activeProductCount = Math.max(0, (shop.activeProductCount || 1) - 1);
      await shop.save();
    }
  }

  refresh();
  return { ok: true, message: `"${p.name}" a été refusé` };
}

export async function archiveProduct(id) {
  const session = await requireSuperAdmin();
  await connectDB();
  const p = await Product.findById(id);
  if (!p) throw new Error("Produit introuvable");

  const wasActive = p.status === "active";
  p.status = "archived";
  p.reviewedBy = session.sub;
  p.reviewedAt = new Date();
  await p.save();

  if (wasActive) {
    const shop = await Shop.findById(p.shop);
    if (shop) {
      shop.activeProductCount = Math.max(0, (shop.activeProductCount || 1) - 1);
      await shop.save();
    }
  }

  refresh();
  return { ok: true, message: `"${p.name}" a été archivé` };
}