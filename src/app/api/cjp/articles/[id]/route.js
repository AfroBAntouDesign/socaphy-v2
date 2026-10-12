// src/app/api/cjp/articles/[id]/route.js
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

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const session = await getSession();
    await connectDB();

    const article = await JournalArticle.findById(id)
      .populate("issue", "volume number year slug")
      .lean();
    if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    // Public can only see published
    if (article.status !== "published") {
      const isOwner = session && article.submittedBy.toString() === session.sub;
      const isAdmin = session && ["superAdmin", "adminSOCAphy"].includes(session.role);
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
    }

    return NextResponse.json({ article: { ...article, _id: article._id.toString() } });
  } catch (err) {
    console.error("GET /api/cjp/articles/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
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
        { error: "Seuls les brouillons peuvent être supprimés" },
        { status: 409 }
      );
    }

    await article.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/cjp/articles/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
