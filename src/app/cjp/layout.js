// src/app/cjp/layout.js
import Link from "next/link";
import { FaBook, FaUsers, FaClipboardList, FaInfoCircle, FaPenNib } from "react-icons/fa";

const NAV = [
  { href: "/cjp", label: "Accueil", icon: FaBook, exact: true },
  { href: "/cjp/about", label: "À propos", icon: FaInfoCircle },
  { href: "/cjp/editorial-board", label: "Comité éditorial", icon: FaUsers },
  { href: "/cjp/instructions", label: "Instructions", icon: FaClipboardList },
  { href: "/cjp/articles", label: "Articles", icon: FaBook },
];

export const metadata = {
  title: {
    default: "Cameroonian Journal of Phytotherapae",
    template: "%s | CJP",
  },
  description:
    "An official publication of the Cameroonian Society of Phytotherapy",
};

export default function CjpLayout({ children }) {
  return (
    <div className="bg-gray-800">
      {/* Sub-nav CJP */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link href="/cjp" className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-emerald-800">
                CJP
              </span>
              <span className="hidden text-xs text-gray-500 sm:inline">
                Cameroonian Journal of Phytotherapae
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/cjp/submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                <FaPenNib /> Soumettre
              </Link>
            </div>
          </div>

          <nav className="flex overflow-x-auto border-t border-gray-100 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Icon className="text-xs opacity-70" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
