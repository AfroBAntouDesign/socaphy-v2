// src/app/api/articles/[id]/submit/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(_req, { params }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await connectDB();
    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    if (article.user.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (article.status !== "draft") {
      return NextResponse.json(
        { error: "Seuls les brouillons peuvent être soumis" },
        { status: 409 }
      );
    }

    // Minimum completeness check
    if (article.kind === "scientific" && !article.abstract?.trim()) {
      return NextResponse.json(
        { error: "Le résumé (abstract) est requis avant soumission" },
        { status: 400 }
      );
    }
    if (article.kind === "practical" && !article.description?.trim()) {
      return NextResponse.json(
        { error: "La description est requise avant soumission" },
        { status: 400 }
      );
    }

    article.status = "submitted";
    article.submittedAt = new Date();
    await article.save();

    return NextResponse.json({
      ok: true,
      message: "Article soumis pour validation",
      status: article.status,
    });
  } catch (err) {
    console.error("POST /api/articles/[id]/submit:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}