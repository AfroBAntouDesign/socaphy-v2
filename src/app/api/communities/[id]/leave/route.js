// src/app/api/communities/[id]/leave/route.js
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

    // Creator cannot leave (must delete or transfer)
    if (community.creator.toString() === session.sub) {
      return NextResponse.json(
        { error: "Le créateur ne peut pas quitter sa propre communauté" },
        { status: 409 }
      );
    }

    const wasMember = community.members?.some((m) => m.toString() === session.sub);
    if (!wasMember) {
      return NextResponse.json({ ok: true, message: "Vous n'étiez pas membre" });
    }

    community.members = community.members.filter(
      (m) => m.toString() !== session.sub
    );
    community.moderators = community.moderators.filter(
      (m) => m.toString() !== session.sub
    );
    community.memberCount = Math.max(0, (community.memberCount || 1) - 1);
    await community.save();

    return NextResponse.json({ ok: true, message: "Vous avez quitté la communauté" });
  } catch (err) {
    console.error("POST leave:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}