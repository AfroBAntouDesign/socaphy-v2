// src/app/api/articles/[id]/attachments/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { saveUpload, deleteUpload } from "@/lib/uploads";

export const runtime = "nodejs";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

async function loadOwnedDraft(id, session) {
  await connectDB();
  const article = await Article.findById(id);
  if (!article) return { error: "Article introuvable", code: 404 };
  if (article.user.toString() !== session.sub) return { error: "Non autorisé", code: 403 };
  if (article.status !== "draft") return { error: "Seul un brouillon est modifiable", code: 409 };
  return { article };
}

/* ── ADD (multipart) ─────────────────────────────────────────────── */

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const found = await loadOwnedDraft(id, session);
    if (found.error) return NextResponse.json({ error: found.error }, { status: found.code });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    const attachment = await saveUpload({ file, userId: session.sub });

    found.article.attachments.push(attachment);
    await found.article.save();

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    console.error("Add attachment:", err.message);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 400 });
  }
}

/* ── REPLACE (multipart, ?index=0) ───────────────────────────────── */

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const url = new URL(request.url);
    const index = Number(url.searchParams.get("index"));

    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: "Index invalide" }, { status: 400 });
    }

    const found = await loadOwnedDraft(id, session);
    if (found.error) return NextResponse.json({ error: found.error }, { status: found.code });

    const old = found.article.attachments[index];
    if (!old) return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    const attachment = await saveUpload({ file, userId: session.sub });
    found.article.attachments.set(index, attachment);
    await found.article.save();
    await deleteUpload(old.fileUrl); // best-effort cleanup

    return NextResponse.json({ attachment });
  } catch (err) {
    console.error("Replace attachment:", err.message);
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 400 });
  }
}

/* ── DELETE (?index=0) ───────────────────────────────────────────── */

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const url = new URL(request.url);
    const index = Number(url.searchParams.get("index"));

    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: "Index invalide" }, { status: 400 });
    }

    const found = await loadOwnedDraft(id, session);
    if (found.error) return NextResponse.json({ error: found.error }, { status: found.code });

    const old = found.article.attachments[index];
    if (!old) return NextResponse.json({ error: "Pièce jointe introuvable" }, { status: 404 });

    found.article.attachments.splice(index, 1);
    await found.article.save();
    await deleteUpload(old.fileUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete attachment:", err.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}