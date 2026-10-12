// src/app/api/cjp/articles/[id]/comments/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import JournalComment from "@/models/JournalComment";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

const schema = z.object({
  content: z.string().trim().min(2).max(5000),
  parent: z.string().optional().nullable(),
});

/* ── POST — add comment ────────────────────────────────────────── */

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Commentaire invalide" }, { status: 400 });
    }

    await connectDB();
    const article = await JournalArticle.findById(id);
    if (!article || article.status !== "published") {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }
    if (!article.commentsEnabled) {
      return NextResponse.json({ error: "Commentaires désactivés" }, { status: 403 });
    }

    const comment = await JournalComment.create({
      article: id,
      author: session.sub,
      content: parsed.data.content,
      parent: parsed.data.parent || null,
    });

    await JournalArticle.updateOne(
      { _id: id },
      { $inc: { commentCount: 1 } }
    );

    const populated = await JournalComment.findById(comment._id)
      .populate("author", "name role avatar")
      .lean();

    return NextResponse.json(
      {
        comment: {
          _id: populated._id.toString(),
          content: populated.content,
          parent: populated.parent?.toString() || null,
          createdAt: populated.createdAt,
          author: {
            _id: populated.author?._id?.toString(),
            name: populated.author?.name,
            role: populated.author?.role,
            avatar: populated.author?.avatar,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST comment:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
