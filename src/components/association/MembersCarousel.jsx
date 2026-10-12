// src/components/association/MembersCarousel.jsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaUserShield,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { ROLE_LABELS } from "@/lib/roles";

const MAX_CARDS = 30;

export default function MembersCarousel() {
  const scrollRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ⬇️ Only render interactive controls after mount (SSR-safe)
  const [mounted, setMounted] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Fetch members ───────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/public/users");
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();

        const filtered = (data.users || [])
          .filter((u) =>
            ["adminSOCAphy", "superAdmin"].includes(u.role)
          )
          .slice(0, MAX_CARDS);

        if (!cancelled) setMembers(filtered);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Track scroll bounds ─────────────────────────────────────── */
  useEffect(() => {
    if (!mounted) return;

    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(
        el.scrollLeft + el.clientWidth < el.scrollWidth - 8
      );
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [members, mounted]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Nos membres
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Membres SOCAphy et Super Administrateurs
            </p>
          </div>

          {/* Arrows — mounted-only */}
          {mounted && (
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={!canScrollLeft}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Précédent"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={!canScrollRight}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Suivant"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Content states */}
        {loading ? (
          <SkeletonRow />
        ) : error ? (
          <ErrorState message={error} />
        ) : members.length === 0 ? (
          <EmptyState />
        ) : (
          <ul
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {members.map((m) => (
              <li
                key={m._id}
                className="w-[80vw] shrink-0 snap-start sm:w-[340px]"
              >
                <MemberCard member={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Card                                                            */
/* ═══════════════════════════════════════════════════════════════ */

function MemberCard({ member }) {
  const isSuperAdmin = member.role === "superAdmin";
  const badgeStyle = isSuperAdmin
    ? "bg-orange-50 text-orange-700 ring-orange-200"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
      {/* Avatar block */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700">
        {member.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatar}
            alt={member.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl font-bold text-white/90">
              {member.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        {/* Role badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 backdrop-blur ${badgeStyle}`}
          >
            {isSuperAdmin ? <FaUserShield /> : <FaUser />}
            {ROLE_LABELS[member.role] || member.role}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-lg font-semibold text-gray-900">
          {member.name || "Membre anonyme"}
        </h3>

        {member.profession && (
          <p className="mt-0.5 truncate text-sm text-gray-600">
            {member.profession}
          </p>
        )}

        {member.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {member.description}
          </p>
        )}

        <div className="mt-4 flex-1" />

        <Link
          href={`/association/members/${member._id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        >
          Voir le profil
          <FaExternalLinkAlt className="text-xs opacity-60" />
        </Link>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

function SkeletonRow() {
  return (
    <div className="flex gap-4 overflow-hidden sm:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[80vw] shrink-0 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm sm:w-[340px]"
        >
          <div className="aspect-[5/4] w-full rounded-t-2xl bg-gray-200" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <p className="text-4xl">👥</p>
      <p className="mt-3 font-medium text-gray-800">
        Aucun membre à afficher pour le moment
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Les membres validés apparaîtront ici.
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <p className="font-medium text-red-800">
        Impossible de charger les membres
      </p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}