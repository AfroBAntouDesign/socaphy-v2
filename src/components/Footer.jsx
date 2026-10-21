import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-bold text-white">
              Soca<span className="text-blue-500">phy</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Votre santé, simplifiée. Trouvez et gérez vos cliniques en un
              seul endroit.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
              Produit
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 transition hover:text-blue-400">Accueil</Link></li>
              <li><Link href="/clinics" className="text-gray-400 transition hover:text-blue-400">Cliniques</Link></li>
              <li><Link href="/about" className="text-gray-400 transition hover:text-blue-400">À propos</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
              Légal
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/privacy" className="text-gray-400 transition hover:text-blue-400">Confidentialité</Link></li>
              <li><Link href="/terms" className="text-gray-400 transition hover:text-blue-400">Conditions</Link></li>
              <li><Link href="/contact" className="text-gray-400 transition hover:text-blue-400">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-200">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@socaphy.com"
                  className="text-gray-400 transition hover:text-blue-400"
                >
                  contact@socaphy.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/237XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition hover:text-blue-400"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-800 pt-6 text-sm text-gray-500 md:flex-row">
          <p>© {year} AfroBantou Digital Solutions. Tous droits réservés.</p>
          <p>
            Développé par{" "}
            <a
              href="https://github.com/AfroBAntouDesign"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-300 transition hover:text-blue-400"
            >
              AfroBantouDesign
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}