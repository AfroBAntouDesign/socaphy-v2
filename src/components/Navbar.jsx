// src/components/Navbar.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaBars,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserPlus,
} from "react-icons/fa";

export default function Navbar({ user = null, onToggleSidebar }) {
  const router = useRouter();
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

          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo with nice glowing design border */}
            <div className="relative">
              {/* Gradient glow effect */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-400 opacity-50 blur-sm group-hover:opacity-100 transition duration-300"></div>
              
              {/* Image container */}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 p-1 ring-1 ring-emerald-500 shadow-md overflow-hidden">
                <Image
                  src="/socaphy-logo.png" // Assumes your transparent logo is in public/logo.png
                  alt="SOCAphy"
                  width={40}
                  height={40}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            
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
                className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold transition hover:bg-orange-600 shadow-sm"
              >
                <FaUserPlus />
                <span className="hidden sm:inline">S'inscrire</span>
                <span className="sm:hidden">Compte</span>
              </Link>
            </>
          ) : (
            <>
              {/* User name — desktop only */}
              <span className="hidden text-sm font-medium text-emerald-100 md:inline">
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