// src/app/api/articles/[id]/submit-to-cjp/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { canSubmitArticleToCjp } from "@/lib/partnership";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!canSubmitArticleToCjp(session.role)) {
      return NextResponse.json(
        { error: "Votre rôle ne permet pas de soumettre au CJP" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const article = await Article.findById(id);
    if (!article) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    if (article.user.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (article.status !== "validated") {
      return NextResponse.json(
        { error: "Seuls les articles validés peuvent être soumis au CJP" },
        { status: 409 }
      );
    }

    const status = article.partnership?.cjpSubmissionStatus || "none";
    if (status === "pending") {
      return NextResponse.json(
        { error: "Cet article est déjà en attente de validation CJP" },
        { status: 409 }
      );
    }
    if (status === "approved") {
      return NextResponse.json(
        { error: "Cet article est déjà publié au CJP" },
        { status: 409 }
      );
    }

    article.partnership = article.partnership || {};
    article.partnership.cjpSubmissionStatus = "pending";
    article.partnership.cjpSubmittedAt = new Date();
    article.partnership.cjpSubmittedBy = session.sub;
    article.partnership.cjpRefusalReason = null;
    await article.save();

    return NextResponse.json({
      ok: true,
      message: "Article soumis au CJP — en attente de validation",
    });
  } catch (err) {
    console.error("POST submit-to-cjp:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
