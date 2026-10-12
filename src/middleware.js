// src/middleware.js
import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { canAccess, homeFor, isRouteDisabled } from "@/lib/roles";

const AUTH_PAGES = ["/auth/login", "/auth/register"];

/** Paths that require authentication (any role). */
const PROTECTED_PREFIXES = ["/adminDashboard", "/users"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── 0. Bloquer les modules désactivés ──────────────────────────
  if (isRouteDisabled(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("disabled", "1");
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // 1. Non connecté + page protégée → login
  if (!session && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Connecté + page d'auth → dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  // 3. Connecté + page protégée non autorisée pour son rôle → dashboard
  if (session && isProtected && !canAccess(session.role, pathname)) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  // 4. Ajouter les infos de session aux headers
  const res = NextResponse.next();
  if (session) {
    res.headers.set("x-user-id", session.sub);
    res.headers.set("x-user-role", session.role);
  }
  return res;
}

export const config = {
  matcher: [
    "/adminDashboard/:path*",
    "/users/:path*",
    "/auth/:path*",
    "/market/:path*",
    "/market",
    "/cjp/:path*",
    "/cjp",
  ],
};
