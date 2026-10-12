// src/app/api/communities/[id]/route.js
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

/* ── GET — detail ───────────────────────────────────────────────── */

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const session = await getSession();
    await connectDB();

    const community = await Community.findById(id)
      .populate("creator", "name avatar role")
      .populate("moderators", "name avatar role")
      .lean();

    if (!community) {
      return NextResponse.json({ error: "Communauté introuvable" }, { status: 404 });
    }

    const isMember = session
      ? community.members?.some((m) => m.toString() === session.sub)
      : false;

    // Hide pending/rejected unless creator/moderator/superAdmin
    const canSee =
      community.status === "active" ||
      (session &&
        (community.creator._id.toString() === session.sub ||
          ["superAdmin", "adminSOCAphy"].includes(session.role) ||
          community.moderators?.some((m) => m._id.toString() === session.sub)));

    if (!canSee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json({
      community: {
        ...community,
        _id: community._id.toString(),
        memberCount: community.memberCount || community.members?.length || 0,
      },
      isMember,
    });
  } catch (err) {
    console.error("GET /api/communities/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE — creator or superAdmin ─────────────────────────────── */

export async function DELETE(_req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const community = await Community.findById(id);
    if (!community) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const canDelete =
      community.creator.toString() === session.sub ||
      session.role === "superAdmin";

    if (!canDelete) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await community.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/communities/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}