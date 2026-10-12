// src/app/api/cjp/reports/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import JournalReport from "@/models/JournalReport";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/cjp";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

const schema = z.object({
  articleId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  commentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  reason: z.enum(REPORT_REASONS.map((r) => r.value)),
  details: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { articleId, commentId, reason, details } = parsed.data;
    if (!articleId && !commentId) {
      return NextResponse.json(
        { error: "Précisez un article ou un commentaire" },
        { status: 400 }
      );
    }

    await connectDB();

    // Prevent duplicate report from same user on the same target
    const existing = await JournalReport.findOne({
      reportedBy: session.sub,
      ...(articleId ? { article: articleId } : {}),
      ...(commentId ? { comment: commentId } : {}),
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà signalé ce contenu" },
        { status: 409 }
      );
    }

    await JournalReport.create({
      article: articleId || undefined,
      comment: commentId || undefined,
      reportedBy: session.sub,
      reason,
      details,
    });

    if (articleId) {
      await JournalArticle.updateOne({ _id: articleId }, { $inc: { reportCount: 1 } });
    }

    return NextResponse.json({ ok: true, message: "Signalement enregistré" }, { status: 201 });
  } catch (err) {
    console.error("POST report:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
