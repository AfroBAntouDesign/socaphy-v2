// src/lib/auth.js
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("⚠️ Please define JWT_SECRET in .env.local");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/* ---------------- Passwords ---------------- */

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/* ---------------- JWT (Edge-compatible) ---------------- */

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/* ---------------- Cookie config ---------------- */

export const COOKIE_NAME = "socaphy_token";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};