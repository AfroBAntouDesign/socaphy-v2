// src/app/api/cv/[id]/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { deleteUpload } from "@/lib/uploads";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── DELETE — owner can delete while submitted ──────────────────── */

export async function DELETE(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const cv = await Cv.findById(id);
    if (!cv) {
      return NextResponse.json({ error: "CV introuvable" }, { status: 404 });
    }
    if (cv.user.toString() !== session.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    if (cv.status !== "submitted") {
      return NextResponse.json(
        { error: "Un CV déjà traité ne peut pas être supprimé" },
        { status: 409 }
      );
    }

    const fileUrl = cv.fileUrl;
    await cv.deleteOne();
    await deleteUpload(fileUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cv DELETE:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}