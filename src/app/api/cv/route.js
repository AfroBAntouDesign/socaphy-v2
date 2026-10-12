// src/app/api/cv/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Cv from "@/models/Cv";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const CV_ROLES = [
  "scientifique",
  "praticienSante",
  "clinic",
  "tradiPraticien",
];

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

/* ── POST — submit a CV ─────────────────────────────────────────── */

const schema = z.object({
  heading: z.string().trim().min(3).max(200),
  fullName: z.string().trim().min(2).max(120),
  profession: z.string().trim().max(120).optional().default(""),
  summary: z.string().trim().max(1500).optional().default(""),
  attachment: z.object({
    fileUrl: z.string().trim().startsWith("/uploads/"),
    originalName: z.string().trim().min(1),
    type: z.string().trim().min(1),
    size: z.number().int().positive(),
    mimeType: z.string().optional(),
  }),
});

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!CV_ROLES.includes(session.role)) {
      return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { attachment, ...fields } = parsed.data;

    // Attachment must be under this user's upload folder
    if (!attachment.fileUrl.startsWith(`/uploads/${session.sub}/`)) {
      return NextResponse.json(
        { error: "Fichier non autorisé" },
        { status: 403 }
      );
    }

    await connectDB();

    // Prevent duplicate submitted CVs
    const existing = await Cv.findOne({
      user: session.sub,
      status: { $in: ["submitted", "approved"] },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === "approved"
              ? "Vous avez déjà un CV approuvé"
              : "Vous avez déjà un CV en attente de validation",
        },
        { status: 409 }
      );
    }

    const cv = await Cv.create({
      user: session.sub,
      heading: fields.heading,
      fullName: fields.fullName,
      profession: fields.profession,
      summary: fields.summary,
      fileUrl: attachment.fileUrl,
      fileName: attachment.originalName,
      fileType: attachment.type,
      fileSize: attachment.size,
      mimeType: attachment.mimeType,
      status: "submitted",
    });

    return NextResponse.json(
      { ok: true, cv: { _id: cv._id.toString(), status: cv.status } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Cv POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── GET — list my CVs ──────────────────────────────────────────── */

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await connectDB();
    const cvs = await Cv.find({ user: session.sub })
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ cvs });
  } catch (err) {
    console.error("Cv GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}