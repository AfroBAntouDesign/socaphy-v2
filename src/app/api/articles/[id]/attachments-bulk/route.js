// src/app/api/articles/[id]/attachments-bulk/route.js
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

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const incoming = Array.isArray(body.attachments) ? body.attachments : [];

    // Only accept attachments whose fileUrl points under this user's folder
    const safe = incoming.filter(
      (a) =>
        a &&
        typeof a.fileUrl === "string" &&
        a.fileUrl.startsWith(`/uploads/${session.sub}/`) &&
        typeof a.type === "string" &&
        typeof a.originalName === "string"
    );

    await connectDB();
    const article = await Article.findById(id);
    if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    if (article.user.toString() !== session.sub)
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (article.status !== "draft")
      return NextResponse.json({ error: "Seul un brouillon est modifiable" }, { status: 409 });

    article.attachments.push(...safe);
    await article.save();

    return NextResponse.json({ ok: true, count: safe.length });
  } catch (err) {
    console.error("attachments-bulk:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}