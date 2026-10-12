// src/app/api/articles/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

/* ------------------------------------------------------------------ */

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

const createSchema = z.object({
  title: z.string().trim().min(5, "Titre trop court").max(200),
  kind: z.enum(["scientific", "practical"]).default("scientific"),
  abstract: z.string().max(2000).optional(),
  introduction: z.string().optional(),
  methods: z.string().optional(),
  results: z.string().optional(),
  discussion: z.string().optional(),
  references: z.array(z.string()).optional(),
  ingredient: z.string().optional(),
  description: z.string().optional(),
  advantages: z.string().optional(),
  sideEffects: z.string().optional(),
  region: z.string().optional(),
  usage: z.string().optional(),
  precautions: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/* ------------------------------------------------------------------ */
/*  GET /api/articles?mine=true                                        */
/* ------------------------------------------------------------------ */

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "true";
    const status = searchParams.get("status");

    await connectDB();

    const query = {};
    if (mine) query.user = session.sub;
    else query.status = "validated"; // public listing only shows validated

    if (status) query.status = status;

    const articles = await Article.find(query)
      .sort({ updatedAt: -1 })
      .limit(100)
      .select("title slug kind status profileType updatedAt createdAt")
      .lean();

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("GET /api/articles:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/articles                                                 */
/* ------------------------------------------------------------------ */

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Only authors can create articles
    const AUTHOR_ROLES = ["scientifique", "tradiPraticien", "clinic", "praticienSante", "adminSOCAphy"];
    if (!AUTHOR_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
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

    const article = await Article.create({
      ...parsed.data,
      user: session.sub,
      profileType: session.role,
      status: "draft",
    });

    return NextResponse.json(
      { article: { _id: article._id.toString(), title: article.title, status: article.status } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/articles:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}