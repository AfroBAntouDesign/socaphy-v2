// src/app/api/products/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { PRODUCT_CATEGORIES, slugify } from "@/lib/marketplace";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET — public list of active products ──────────────────────── */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const category = searchParams.get("category");
    const mine = searchParams.get("mine") === "true";

    await connectDB();

    const query = { status: "active" };

    if (mine) {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      delete query.status;
      query.owner = session.sub;
    } else if (category && PRODUCT_CATEGORIES.some((c) => c.value === category)) {
      query.category = category;
    }

    if (q) query.$text = { $search: q };

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(80)
      .populate("shop", "name slug city region")
      .select("name slug description category price currency unit stock images status shop createdAt")
      .lean();

    return NextResponse.json({
      products: products.map((p) => ({ ...p, _id: p._id.toString() })),
    });
  } catch (err) {
    console.error("GET /api/products:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST — create product (owner of an active shop) ───────────── */

const createSchema = z.object({
  name: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(3000),
  category: z.enum(PRODUCT_CATEGORIES.map((c) => c.value)),
  price: z.number().nonnegative(),
  unit: z.string().trim().max(40).optional().default(""),
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string()).max(5).optional().default([]),
  ingredients: z.string().trim().max(1000).optional().default(""),
  usage: z.string().trim().max(1000).optional().default(""),
  precautions: z.string().trim().max(1000).optional().default(""),
  sideEffects: z.string().trim().max(1000).optional().default(""),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    await connectDB();

    const shop = await Shop.findOne({ owner: session.sub });
    if (!shop) {
      return NextResponse.json(
        { error: "Créez d'abord votre boutique." },
        { status: 400 }
      );
    }
    if (shop.status !== "active") {
      return NextResponse.json(
        { error: "Votre boutique doit d'abord être validée." },
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

    // Validate image URLs are under this user's folder
    const safeImages = (parsed.data.images || []).filter(
      (url) =>
        typeof url === "string" && url.startsWith(`/uploads/${session.sub}/`)
    );

    let slug = slugify(parsed.data.name);
    if (await Product.findOne({ slug })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const product = await Product.create({
      ...parsed.data,
      images: safeImages,
      slug,
      shop: shop._id,
      owner: session.sub,
      status: "pending",
    });

    // Update shop counter
    shop.productCount = (shop.productCount || 0) + 1;
    await shop.save();

    return NextResponse.json(
      {
        ok: true,
        product: { _id: product._id.toString(), name: product.name },
        message:
          "Produit créé. Il sera visible sur le marché après validation par un administrateur.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/products:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}