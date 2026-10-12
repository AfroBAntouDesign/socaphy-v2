// src/app/api/articles/[id]/route.js
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

/* ------------------------------------------------------------------ */
/*  GET — read one article (owner or if validated)                     */
/* ------------------------------------------------------------------ */

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectDB();
    const article = await Article.findById(id).lean();
    if (!article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    const isOwner = session && article.user.toString() === session.sub;
    const isAdmin = session && ["superAdmin", "adminSOCAphy"].includes(session.role);

    if (article.status !== "validated" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ article });
  } catch (err) {
    console.error("GET /api/articles/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — update (owner, only while draft)                           */
/* ------------------------------------------------------------------ */

export async function PATCH(request, { params }) {
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
        { error: "Seuls les brouillons peuvent être modifiés" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const allowed = [
      "title", "abstract", "introduction", "methods", "results", "discussion",
      "references", "ingredient", "description", "advantages", "sideEffects",
      "region", "usage", "precautions", "tags",
    ];
    for (const key of allowed) {
      if (key in body) article[key] = body[key];
    }

    await article.save();
    return NextResponse.json({ ok: true, article: { _id: article._id.toString(), title: article.title } });
  } catch (err) {
    console.error("PATCH /api/articles/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — owner, only while draft                                   */
/* ------------------------------------------------------------------ */

export async function DELETE(_req, { params }) {
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
        { error: "Seuls les brouillons peuvent être supprimés" },
        { status: 409 }
      );
    }

    await article.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/articles/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}