// src/components/Sidebar.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaSignOutAlt,
  FaSignInAlt,
  FaUser,
  FaUserCog,
} from "react-icons/fa";
import { NAV_BY_ROLE, GUEST_NAV } from "@/lib/nav-config";

export default function Sidebar({ user = null, open = false, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const items = user ? NAV_BY_ROLE[user.role] ?? [] : GUEST_NAV;

  // Close on mobile after navigation
  useEffect(() => {
    if (open && onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navigation principale"
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col bg-emerald-800 text-white transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-emerald-700 px-4">
          <span className="text-lg font-bold tracking-wide text-orange-400">
            SOCAphy
          </span>
          <button
            onClick={onClose}
            className="rounded p-2 transition hover:bg-emerald-700 lg:hidden"
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        {/* Nav — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {items.length === 0 ? (
            <p className="px-3 text-sm text-emerald-200">
              Aucun menu disponible pour ce rôle.
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={`${href}-${label}`}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-emerald-900 text-white"
                          : "text-emerald-50 hover:bg-emerald-700"
                      }`}
                    >
                      <Icon className="shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Footer — user + actions */}
        <div className="shrink-0 border-t border-emerald-700 p-3">
          {user ? (
            <>
              {/* User card — clickable to profile */}
              <Link
                href="/users/profile"
                className={`flex items-center gap-3 rounded-lg p-2 transition ${
                  pathname === "/users/profile"
                    ? "bg-emerald-900"
                    : "hover:bg-emerald-700"
                }`}
              >
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.name || "Avatar"}
                    fill
                    sizes="40px"
                    className="rounded-full border-2 border-emerald-600 object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user.name || "Utilisateur"}
                  </p>
                  <p className="truncate text-xs text-emerald-200">
                    {user.email || "—"}
                  </p>
                </div>
              </Link>

              {/* Profile + Logout */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/users/profile"
                  className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition ${
                    pathname === "/users/profile"
                      ? "bg-emerald-900 text-white"
                      : "bg-emerald-900/60 text-emerald-50 hover:bg-emerald-700"
                  }`}
                  title="Mon profil"
                >
                  <FaUserCog className="shrink-0" aria-hidden />
                  <span className="truncate">Profil</span>
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center justify-center gap-2 rounded-md bg-emerald-900/60 px-2 py-2 text-xs font-medium text-emerald-50 transition hover:bg-red-600 disabled:opacity-60"
                  title="Se déconnecter"
                >
                  <FaSignOutAlt className="shrink-0" aria-hidden />
                  <span className="truncate">
                    {loggingOut ? "…" : "Sortir"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-emerald-200">
                  <FaUser className="text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Visiteur</p>
                  <p className="truncate text-xs text-emerald-200">
                    Non connecté
                  </p>
                </div>
              </div>

              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 rounded-md bg-emerald-900 px-3 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-600"
              >
                <FaSignInAlt />
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}