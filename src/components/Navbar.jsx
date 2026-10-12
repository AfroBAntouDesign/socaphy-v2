// src/components/Navbar.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaBars,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserPlus,
} from "react-icons/fa";
import logo from "@/../public/logo.png";

export default function Navbar({ user = null, onToggleSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-emerald-800/40 bg-emerald-700 text-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left — hamburger + brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-md p-2 transition hover:bg-emerald-600 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <FaBars className="text-xl" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logo}
              alt="SOCAphy"
              width={36}
              height={36}
              priority
              className="h-9 w-9"
            />
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              SOCAphy
            </span>
          </Link>
        </div>

        {/* Right — auth actions */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                href="/auth/login"
                className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-emerald-600 sm:inline-flex"
              >
                <FaSignInAlt /> Se connecter
              </Link>

              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold transition hover:bg-orange-600"
              >
                <FaUserPlus />
                <span className="hidden sm:inline">S'inscrire</span>
                <span className="sm:hidden">Compte</span>
              </Link>
            </>
          ) : (
            <>
              {/* User name — desktop only */}
              <span className="hidden text-sm text-emerald-100 md:inline">
                {user.name}
              </span>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-emerald-600 disabled:opacity-60"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">
                  {loggingOut ? "..." : "Déconnexion"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}