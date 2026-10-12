// src/app/api/auth/me/avatar/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image trop volumineuse (max 5 Mo)" },
        { status: 400 }
      );
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Format non supporté (PNG, JPG, WEBP, GIF)" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const oldAvatar = user.avatar;

    // Save new avatar
    const dir = path.join(UPLOAD_ROOT, session.sub, "avatars");
    await fs.mkdir(dir, { recursive: true });
    const storedName = `avatar_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
    const fullPath = path.join(dir, storedName);
    await fs.writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

    user.avatar = `/uploads/${session.sub}/avatars/${storedName}`;
    await user.save();

    // Best-effort cleanup of old avatar (only if it was ours)
    if (oldAvatar?.startsWith(`/uploads/${session.sub}/`)) {
      const oldPath = path.join(UPLOAD_ROOT, oldAvatar.replace(/^\/uploads\//, ""));
      if (oldPath.startsWith(UPLOAD_ROOT)) {
        fs.unlink(oldPath).catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      avatar: user.avatar,
      message: "Photo de profil mise à jour",
    });
  } catch (err) {
    console.error("Avatar POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE — remove avatar ──────────────────────────────────────── */

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const oldAvatar = user.avatar;
    user.avatar = null;
    await user.save();

    if (oldAvatar?.startsWith(`/uploads/${session.sub}/`)) {
      const oldPath = path.join(UPLOAD_ROOT, oldAvatar.replace(/^\/uploads\//, ""));
      if (oldPath.startsWith(UPLOAD_ROOT)) {
        fs.unlink(oldPath).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, message: "Photo supprimée" });
  } catch (err) {
    console.error("Avatar DELETE:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}