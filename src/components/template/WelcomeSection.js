// src/components/template/WelcomeSection.js
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  FaBook, FaUserPlus, FaArrowRight, FaNewspaper, FaLeaf,
} from "react-icons/fa";
import banner from "@/../public/banner.jpg";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await verifyToken(token) : null;
}

export default async function WelcomeSection({ searchParams }) {
  const params = await searchParams;
  const showDisabledNotice = params?.disabled === "1";

  const session = await getSession();
  const isLoggedIn = !!session && session.role !== "visiteur";

  const primaryHref = isLoggedIn ? homeFor(session.role) : "/auth/register";
  const primaryLabel = isLoggedIn ? "Accéder à mon espace" : "Créer un compte";

  
  return (
    
    <section className="relative isolate overflow-hidden">
      {/* Background */}
      <Image
        src={banner}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/60 to-black/80" />

      {/* Content */}
      <div className="mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Journal badge */}
        <Link
          href="/cjp"
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur transition hover:border-emerald-400/70 hover:bg-emerald-500/20"
        >
          <FaNewspaper className="text-[11px]" />
          <span>Cameroonian Journal of Phytotherapae</span>
          <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
        </Link>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Bienvenue sur{" "}
          <span className="text-emerald-400">SOCA</span>
          <span className="text-orange-400">phy</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-gray-100 sm:text-lg md:text-xl">
          La plateforme qui valorise la{" "}
          <span className="font-semibold text-orange-300">
            médecine traditionnelle camerounaise
          </span>
          , relie les{" "}
          <span className="font-semibold text-emerald-300">
            praticiens, les cliniques et les chercheurs
          </span>{" "}
          pour un avenir médical enraciné dans la nature.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {!isLoggedIn && <FaUserPlus />}
            {primaryLabel}
          </Link>
          <Link
            href="/publicSpace"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <FaLeaf /> Explorer les articles
          </Link>
        </div>

        {/* Secondary — Journal CJP prominent card */}
        <div className="mt-12 w-full max-w-3xl">
          <Link
            href="/cjp"
            className="group flex flex-col items-start gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-left backdrop-blur-md transition hover:border-emerald-400/40 hover:bg-white/10 sm:flex-row sm:items-center"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md">
              <FaBook className="text-lg" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Journal scientifique officiel
              </p>
              <h2 className="mt-1 font-serif text-lg font-bold text-white sm:text-xl">
                Cameroonian Journal of Phytotherapae
              </h2>
              <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                Une publication officielle de la Société Camerounaise de
                Phytothérapie — ISSN, articles validés, soumissions ouvertes
                aux membres SOCAphy.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-emerald-600/90 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-emerald-600 sm:inline-flex">
              Accéder au journal
              <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>

              {showDisabledNotice && (
          <div className="mt-8 rounded-lg border border-orange-400/40 bg-orange-500/10 px-4 py-3 text-sm text-orange-200 backdrop-blur">
            Ce module n'est pas encore disponible. Il sera activé prochainement.
          </div>
        )}
        
    </section>
  );
}
