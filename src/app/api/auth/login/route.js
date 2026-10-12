// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { homeFor } from "@/lib/roles";

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    await connectDB();
    const { email, password, expectedRole } = parsed.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Hidden /superadmin page enforces superAdmin role
    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    if (user.status === "pending") {
      return NextResponse.json(
        { error: "Votre compte est en attente de validation par un administrateur." },
        { status: 403 }
      );
    }
    if (user.status === "rejected") {
      return NextResponse.json(
        { error: user.rejectionReason || "Votre demande d'inscription a été refusée." },
        { status: 403 }
      );
    }
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Votre compte est suspendu. Contactez un administrateur." },
        { status: 403 }
      );
    }

    User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    ).catch(() => {});

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
    });

    const res = NextResponse.json({
      message: "Connecté",
      redirectTo: homeFor(user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    res.cookies.set(COOKIE_NAME, token, cookieOptions);
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}