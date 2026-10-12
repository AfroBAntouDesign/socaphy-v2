// src/app/api/cjp/articles/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import JournalArticle from "@/models/JournalArticle";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { ARTICLE_SECTIONS, SUBMITTER_ROLES, formatCjpId } from "@/lib/cjp";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET — my submissions or public list ──────────────────────── */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";

    await connectDB();

    if (mine) {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

      const articles = await JournalArticle.find({ submittedBy: session.sub })
        .sort({ updatedAt: -1 })
        .select("cjpId title status section submittedAt publishedAt createdAt updatedAt rejectionReason")
        .lean();

      return NextResponse.json({ articles: articles.map((a) => ({ ...a, _id: a._id.toString() })) });
    }

    const articles = await JournalArticle.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(100)
      .select("cjpId title authors section publishedAt abstractFR abstractEN")
      .lean();

    return NextResponse.json({ articles: articles.map((a) => ({ ...a, _id: a._id.toString() })) });
  } catch (err) {
    console.error("GET /api/cjp/articles:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST — create draft ──────────────────────────────────────── */

const authorSchema = z.object({
  name: z.string().trim().min(2),
  title: z.string().trim().optional().default(""),
  affiliation: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  orcid: z.string().trim().optional().default(""),
  isCorresponding: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

const createSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(300),
  titleFR: z.string().trim().max(300).optional().default(""),
  titleEN: z.string().trim().max(300).optional().default(""),
  abstractFR: z.string().trim().max(3000).optional().default(""),
  abstractEN: z.string().trim().max(3000).optional().default(""),
  keywordsFR: z.array(z.string()).optional().default([]),
  keywordsEN: z.array(z.string()).optional().default([]),
  authors: z.array(authorSchema).min(1, "Au moins un auteur"),
  section: z.enum(ARTICLE_SECTIONS.map((s) => s.value)),
  language: z.enum(["fr", "en", "bilingual"]).default("fr"),
  introduction: z.string().optional().default(""),
  methods: z.string().optional().default(""),
  results: z.string().optional().default(""),
  discussion: z.string().optional().default(""),
  conclusion: z.string().optional().default(""),
  acknowledgments: z.string().optional().default(""),
  funding: z.string().optional().default(""),
  conflictsOfInterest: z.string().optional().default(""),
  dataAvailability: z.string().optional().default(""),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    if (!SUBMITTER_ROLES.includes(session.role)) {
      return NextResponse.json(
        { error: "Votre rôle ne permet pas de soumettre au CJP" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate CJP ID: CJP-YYYY-NNNN
    const year = new Date().getFullYear();
    const prefix = `CJP-${year}-`;
    const last = await JournalArticle.findOne({ cjpId: new RegExp(`^${prefix}`) })
      .sort({ cjpId: -1 })
      .select("cjpId")
      .lean();
    const nextSeq = last ? parseInt(last.cjpId.slice(-4), 10) + 1 : 1;
    const cjpId = formatCjpId(year, nextSeq);

    const article = await JournalArticle.create({
      ...parsed.data,
      cjpId,
      submittedBy: session.sub,
      status: "draft",
    });

    return NextResponse.json(
      { article: { _id: article._id.toString(), cjpId: article.cjpId, status: article.status } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/cjp/articles:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
