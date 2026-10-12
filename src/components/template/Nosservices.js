// src/components/template/Nosservices.js
import Link from "next/link";
import {
  FaFileAlt, FaUsers, FaStore, FaClipboardList,
  FaComments, FaShoppingBasket, FaUserMd,
  FaUserPlus, FaSignInAlt,
} from "react-icons/fa";

const SERVICES = [
  {
    href: "/publicSpace",
    icon: FaFileAlt,
    title: "Consulter les articles scientifiques",
    description:
      "Ces articles sont approuvés et validés par des experts de la communauté SOCAphy.",
    cta: "Consulter",
    accent: "emerald",
  },
  {
    href: "/dashboard/admins/adminSOCAphy",
    icon: FaUsers,
    title: "Rejoindre la communauté scientifique SOCAphy",
    description:
      "Formulez une demande pour rejoindre notre communauté de scientifiques et nous aider à promouvoir nos valeurs. Les conditions d'admission sont décrites sur la page dédiée.",
    cta: "Postuler",
    accent: "orange",
  },
  {
    href: "/market",
    icon: FaStore,
    title: "Acheter un produit médical traditionnel",
    description:
      "Commandez et faites-vous livrer un médicament testé, analysé et validé selon les normes camerounaises, approuvées par le MINSANTE.",
    cta: "Acheter",
    accent: "red",
  },
  {
    href: "/dashboard/admins/articles",
    icon: FaClipboardList,
    title: "Publier un article",
    description:
      "Un processus rigoureux : la fiabilité et la politique de la SOCAphy en dépendent. Les articles sont soumis à une réglementation stricte.",
    cta: "Publier",
    accent: "blue",
  },
  {
    href: "/users/communaute",
    icon: FaComments,
    title: "Créer une communauté médicale",
    description:
      "Créez une communauté autour d'un thème spécifique pour valoriser une idéologie médicale et échanger sur les traitements traditionnels.",
    cta: "Gérer",
    accent: "orange",
  },
  {
    href: "/market/open",
    icon: FaShoppingBasket,
    title: "Ouvrir un espace de vente",
    description:
      "Vendez des produits recherchés pour leurs vertus thérapeutiques. L'ouverture est réglementée par les scientifiques de la SOCAphy.",
    cta: "Ouvrir",
    accent: "emerald",
  },
  {
    href: "/specialists",
    icon: FaUserMd,
    title: "Parler à un spécialiste",
    description:
      "Mise en contact avec une clinique, un cabinet médical ou un spécialiste pour vos préoccupations de santé, via les membres SOCAphy.",
    cta: "Contacter",
    accent: "blue",
  },
  {
    href: "/auth/register",
    icon: FaUserPlus,
    title: "Créer un compte",
    description:
      "Choisissez le profil adapté à votre situation. Votre compte sera validé par les administrateurs.",
    cta: "S'inscrire",
    accent: "orange",
  },
  {
    href: "/auth/login",
    icon: FaSignInAlt,
    title: "Se connecter",
    description:
      "Accédez directement à votre compte. Contactez les administrateurs en cas d'identifiant oublié.",
    cta: "Connexion",
    accent: "emerald",
  },
];

const ACCENT = {
  emerald: {
    text: "text-emerald-700",
    bg: "bg-emerald-600",
    ring: "group-hover:ring-emerald-300",
    hover: "hover:bg-emerald-50",
  },
  orange: {
    text: "text-orange-600",
    bg: "bg-orange-500",
    ring: "group-hover:ring-orange-300",
    hover: "hover:bg-orange-50",
  },
  red: {
    text: "text-red-600",
    bg: "bg-red-600",
    ring: "group-hover:ring-red-300",
    hover: "hover:bg-red-50",
  },
  blue: {
    text: "text-blue-600",
    bg: "bg-blue-600",
    ring: "group-hover:ring-blue-300",
    hover: "hover:bg-blue-50",
  },
};

export default function Nosservices() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Nos services
        </h2>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Tout ce que la plateforme SOCAphy met à votre disposition.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const a = ACCENT[s.accent];
          const Icon = s.icon;

          return (
            <Link
              key={s.title}
              href={s.href}
              className={`group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-gray-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${a.ring} ${a.hover}`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${a.bg} text-white`}>
                <Icon className="text-xl" aria-hidden />
              </div>

              <h3 className={`mb-2 text-lg font-semibold leading-snug ${a.text}`}>
                {s.title}
              </h3>

              <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600">
                {s.description}
              </p>

              <span
                className={`inline-flex w-fit rounded-lg px-4 py-2 text-sm font-semibold text-white ${a.bg} transition group-hover:brightness-110`}
              >
                {s.cta}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}