// src/app/api/shops/mine/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Shop from "@/models/Shop";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import {
  SHOP_OWNER_ROLES,
  REQUIRES_VALIDATED_ARTICLE,
} from "@/lib/marketplace";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await connectDB();

    const shop = await Shop.findOne({ owner: session.sub }).lean();

    // Check whether user is even allowed to open a shop
    const canOpenShop = SHOP_OWNER_ROLES.includes(session.role);
    let requiresArticle = REQUIRES_VALIDATED_ARTICLE.includes(session.role);
    let hasValidatedArticle = false;

    if (requiresArticle) {
      const count = await Article.countDocuments({
        user: session.sub,
        status: "validated",
      });
      hasValidatedArticle = count > 0;
    }

    return NextResponse.json({
      shop: shop ? { ...shop, _id: shop._id.toString() } : null,
      canOpenShop,
      requiresArticle,
      hasValidatedArticle,
    });
  } catch (err) {
    console.error("GET /api/shops/mine:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}