// src/app/api/uploads/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { saveUpload, MAX_FILE_SIZE } from "@/lib/uploads";

export const runtime = "nodejs";      // ⬅️ ici
export const maxDuration = 30;        // ⬅️ ici

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

    const attachment = await saveUpload({ file, userId: session.sub });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err.message);
    return NextResponse.json(
      { error: err.message || "Échec de l'upload" },
      { status: 400 }
    );
  }
}