// src/app/api/communities/[id]/join/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const community = await Community.findById(id);
    if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    if (community.status !== "active") {
      return NextResponse.json(
        { error: "Cette communauté n'est pas encore active" },
        { status: 403 }
      );
    }

    const alreadyIn = community.members?.some((m) => m.toString() === session.sub);
    if (alreadyIn) {
      return NextResponse.json({ ok: true, message: "Vous êtes déjà membre" });
    }

    community.members = [...(community.members || []), session.sub];
    community.memberCount = (community.memberCount || 0) + 1;
    await community.save();

    return NextResponse.json({ ok: true, message: "Vous avez rejoint la communauté" });
  } catch (err) {
    console.error("POST join:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}