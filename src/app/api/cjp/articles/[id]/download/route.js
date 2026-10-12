// src/app/api/cjp/articles/[id]/download/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await connectDB();
    const article = await JournalArticle.findById(id).select("status attachments downloads").lean();
    if (!article || article.status !== "published") {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const pdf = article.attachments?.find((a) => a.type === "pdf");
    if (!pdf) return NextResponse.json({ error: "Aucun PDF disponible" }, { status: 404 });

    JournalArticle.updateOne({ _id: id }, { $inc: { downloads: 1 } }).catch(() => {});

    return NextResponse.redirect(new URL(pdf.fileUrl, "http://localhost"));
  } catch (err) {
    console.error("download:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
