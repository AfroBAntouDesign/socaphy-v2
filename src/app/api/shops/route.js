// src/app/api/shops/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import {
  SHOP_OWNER_ROLES,
  REQUIRES_VALIDATED_ARTICLE,
  slugify,
} from "@/lib/marketplace";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET — list active shops (public) ───────────────────────────── */

export async function GET() {
  try {
    await connectDB();
    const shops = await Shop.find({ status: "active" })
      .sort({ activeProductCount: -1, createdAt: -1 })
      .limit(60)
      .select("name slug description logo banner city region activeProductCount productCount")
      .lean();

    return NextResponse.json({
      shops: shops.map((s) => ({ ...s, _id: s._id.toString() })),
    });
  } catch (err) {
    console.error("GET /api/shops:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST — create my shop ──────────────────────────────────────── */

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(1000),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  region: z.string().trim().max(80).optional().default(""),
  openingHours: z.string().trim().max(200).optional().default(""),
  licenseNumber: z.string().trim().max(80).optional().default(""),
  logo: z.string().trim().optional().default(""),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!SHOP_OWNER_ROLES.includes(session.role)) {
      return NextResponse.json(
        { error: "Votre rôle ne permet pas d'ouvrir une boutique" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    // Only one shop per user
    const existing = await Shop.findOne({ owner: session.sub });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà une boutique", shopId: existing._id.toString() },
        { status: 409 }
      );
    }

    // Condition: scientists need at least 1 validated article
    if (REQUIRES_VALIDATED_ARTICLE.includes(session.role)) {
      const count = await Article.countDocuments({
        user: session.sub,
        status: "validated",
      });
      if (count === 0) {
        return NextResponse.json(
          {
            error:
              "Vous devez avoir au moins un article validé par le comité scientifique avant d'ouvrir une boutique.",
          },
          { status: 403 }
        );
      }
    }

    // Unique slug
    let slug = slugify(parsed.data.name);
    if (await Shop.findOne({ slug })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const shop = await Shop.create({
      ...parsed.data,
      slug,
      owner: session.sub,
      status: "pending",
    });

    return NextResponse.json(
      {
        ok: true,
        shop: { _id: shop._id.toString(), name: shop.name, status: shop.status },
        message:
          "Boutique créée. Elle sera visible après validation par un administrateur.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/shops:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}