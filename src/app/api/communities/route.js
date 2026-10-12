// src/app/api/communities/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Community, { CATEGORIES } from "@/models/Community";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET — list communities ─────────────────────────────────────── */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const category = searchParams.get("category") || null;
    const mine = searchParams.get("mine") === "true";

    const session = await getSession();

    await connectDB();

    const query = { status: "active", isPublic: true };
    if (category && CATEGORIES.includes(category)) query.category = category;
    if (q) query.$text = { $search: q };
    if (mine) {
      if (!session) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      delete query.isPublic;
      query.$or = [
        { creator: session.sub },
        { members: session.sub },
        { moderators: session.sub },
      ];
    }

    const communities = await Community.find(query)
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(50)
      .select("name slug description theme category avatar coverImage memberCount postCount createdAt")
      .lean();

    // If logged in, add `isMember` flag per community
    if (session) {
      const withFlags = communities.map((c) => ({
        ...c,
        _id: c._id.toString(),
      }));
      return NextResponse.json({ communities: withFlags });
    }

    return NextResponse.json({
      communities: communities.map((c) => ({ ...c, _id: c._id.toString() })),
    });
  } catch (err) {
    console.error("GET /api/communities:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST — create community ────────────────────────────────────── */

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  theme: z.string().trim().max(200).optional().default(""),
  rules: z.string().trim().max(3000).optional().default(""),
  category: z.enum(CATEGORIES).default("other"),
  isPublic: z.boolean().default(true),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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

    const { name, ...rest } = parsed.data;

    if (await Community.findOne({ name })) {
      return NextResponse.json(
        { error: "Une communauté avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Generate a slug
    const slug =
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) +
      "-" +
      Date.now().toString(36).slice(-4);

    const community = await Community.create({
      name,
      slug,
      ...rest,
      creator: session.sub,
      moderators: [session.sub],
      members: [session.sub],
      memberCount: 1,
      status: "pending",
    });

    return NextResponse.json(
      {
        ok: true,
        community: {
          _id: community._id.toString(),
          name: community.name,
          status: community.status,
        },
        message:
          "Communauté créée. Elle sera visible après validation par un administrateur.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/communities:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}