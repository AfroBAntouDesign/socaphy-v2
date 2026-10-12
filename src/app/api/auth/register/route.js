// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { homeFor, isOpenRole } from "@/lib/roles";

export async function POST(request) {
  try {
    /* ── 1. Validate input ─────────────────────────────────────── */
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectDB();
    const { name, email, password, role } = parsed.data;

    /* ── 2. Prevent duplicate email ────────────────────────────── */
    if (await User.findOne({ email })) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    /* ── 3. Determine account activation tier ──────────────────── */
    //  OPEN roles (patient, scientifique, clinic, …) → active now.
    //  PENDING roles (currently none)               → need admin approval.
    const isOpen = isOpenRole(role);
    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      status: isOpen ? "active" : "pending",
      verified: isOpen,
    });

    /* ── 4a. Pending tier ─ no login, no cookie ────────────────── */
    if (!isOpen) {
      return NextResponse.json(
        {
          message:
            "Votre demande a été enregistrée. Elle sera examinée par un administrateur avant activation de votre compte.",
          pending: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
        { status: 202 } // Accepted — request received, not fulfilled
      );
    }

    /* ── 4b. Open tier ─ auto-login via httpOnly cookie ────────── */
    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
    });

    const res = NextResponse.json(
      {
        message: "Compte créé",
        redirectTo: homeFor(user.role), // e.g. scientifique → /users/scientifique
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 } // Created
    );

    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}