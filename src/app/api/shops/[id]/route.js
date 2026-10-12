// src/app/api/shops/[id]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

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
    const shop = await Shop.findById(id)
      .populate("owner", "name avatar role city")
      .lean();
    if (!shop) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    return NextResponse.json({ shop: { ...shop, _id: shop._id.toString() } });
  } catch (err) {
    console.error("GET /api/shops/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH — owner edits own shop (limited fields) ──────────────── */

export async function PATCH(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const shop = await Shop.findById(id);
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    if (shop.owner.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      "name", "description", "phone", "email", "address", "city", "region",
      "openingHours", "licenseNumber", "logo",
    ];
    for (const k of allowed) {
      if (k in body) shop[k] = body[k];
    }
    await shop.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/shops/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}