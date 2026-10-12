// src/app/api/auth/me/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── GET ─────────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.sub).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        verified: user.verified,
        description: user.description,
        biography: user.biography,
        expertise: user.expertise,
        parcours: user.parcours,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Me GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH — name / email / avatar ───────────────────────────────── */

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email("Email invalide").optional(),
  avatar: z.string().trim().optional(),
  description: z.string().max(500).optional(),
  biography: z.string().max(5000).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
});

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const { email, ...rest } = parsed.data;

    // Email change → check uniqueness
    if (email && email !== user.email) {
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
      user.email = email;
    }

    // Apply rest (name, avatar, description, …)
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) user[k] = v;
    }

    await user.save();

    return NextResponse.json({
      ok: true,
      message: "Profil mis à jour",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        description: user.description,
        biography: user.biography,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Me PATCH:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}