// src/app/api/auth/me/password/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME, comparePassword, hashPassword } from "@/lib/auth";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

const schema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(72)
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    await connectDB();
    const user = await User.findById(session.sub).select("+password");
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'actuel" },
        { status: 400 }
      );
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ ok: true, message: "Mot de passe modifié" });
  } catch (err) {
    console.error("Password PATCH:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}