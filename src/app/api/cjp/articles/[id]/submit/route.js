// src/app/api/cjp/articles/[id]/submit/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const article = await JournalArticle.findById(id);
    if (!article) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    if (article.submittedBy.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (article.status !== "draft") {
      return NextResponse.json(
        { error: "Seuls les brouillons peuvent être soumis" },
        { status: 409 }
      );
    }

    // Minimal completeness
    if (!article.title || article.title.length < 10) {
      return NextResponse.json({ error: "Titre requis (min 10 caractères)" }, { status: 400 });
    }
    if (!article.authors || article.authors.length === 0) {
      return NextResponse.json({ error: "Au moins un auteur est requis" }, { status: 400 });
    }
    if (!article.abstractFR && !article.abstractEN) {
      return NextResponse.json({ error: "Un résumé (FR ou EN) est requis" }, { status: 400 });
    }

    article.status = "submitted";
    article.submittedAt = new Date();
    await article.save();

    return NextResponse.json({
      ok: true,
      message: "Article soumis pour évaluation",
      cjpId: article.cjpId,
    });
  } catch (err) {
    console.error("POST submit:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
