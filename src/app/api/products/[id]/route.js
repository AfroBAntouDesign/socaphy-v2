// src/app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { deleteUpload } from "@/lib/uploads";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await connectDB();
    const product = await Product.findById(id)
      .populate("shop", "name slug city region phone logo status")
      .populate("owner", "name avatar role")
      .lean();
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });

    // Non-active products only visible to owner or admin
    if (product.status !== "active") {
      const session = await getSession();
      const isOwner = session && product.owner._id.toString() === session.sub;
      const isAdmin = session && ["superAdmin", "adminSOCAphy"].includes(session.role);
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    // Increment views for active products
    if (product.status === "active") {
      Product.updateOne({ _id: id }, { $inc: { views: 1 } }).catch(() => {});
    }

    return NextResponse.json({ product: { ...product, _id: product._id.toString() } });
  } catch (err) {
    console.error("GET /api/products/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH — owner edits own product (reverts to pending if active) ─ */

export async function PATCH(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    if (product.owner.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      "name", "description", "category", "price", "unit", "stock",
      "images", "ingredients", "usage", "precautions", "sideEffects",
    ];
    for (const k of allowed) {
      if (k in body) product[k] = body[k];
    }

    // Any substantive edit → back to pending
    if (product.status === "active" || product.status === "rejected") {
      product.status = "pending";
      product.rejectionReason = null;
      product.reviewedBy = null;
      product.reviewedAt = null;
    }

    await product.save();
    return NextResponse.json({ ok: true, status: product.status });
  } catch (err) {
    console.error("PATCH /api/products/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE ─────────────────────────────────────────────────────── */

export async function DELETE(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    if (product.owner.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const shop = await Shop.findById(product.shop);
    const wasActive = product.status === "active";
    const images = product.images || [];

    await product.deleteOne();
    if (shop) {
      shop.productCount = Math.max(0, (shop.productCount || 1) - 1);
      if (wasActive) {
        shop.activeProductCount = Math.max(0, (shop.activeProductCount || 1) - 1);
      }
      await shop.save();
    }

    for (const url of images) await deleteUpload(url);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}