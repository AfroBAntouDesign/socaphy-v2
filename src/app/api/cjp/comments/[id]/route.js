// src/app/api/cjp/comments/[id]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import JournalComment from "@/models/JournalComment";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function DELETE(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const comment = await JournalComment.findById(id);
    if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

    const isOwner = comment.author.toString() === session.sub;
    const isAdmin = ["superAdmin", "adminSOCAphy"].includes(session.role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Soft-delete: keep replies intact
    comment.status = "deleted";
    await comment.save();

    await JournalArticle.updateOne(
      { _id: comment.article },
      { $inc: { commentCount: -1 } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE comment:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
