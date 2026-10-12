// src/components/association/OrganigrammeSection.jsx
import {
  FaUsers, FaSitemap, FaClipboardCheck, FaBullhorn,
  FaHandshake, FaCalculator, FaUserTie, FaGavel,
} from "react-icons/fa";

const EXECUTIVE = [
  {
    icon: FaUserTie,
    label: "Présidence",
    detail: "Président · Vice-Président (2)",
  },
  {
    icon: FaSitemap,
    label: "Secrétariat Général",
    detail: "Secrétaire Général · Adjoint(e)s (2)",
  },
  {
    icon: FaCalculator,
    label: "Trésorerie",
    detail: "Trésorier (1)",
  },
];

const COMMISSIONS = [
  {
    icon: FaClipboardCheck,
    label: "Commission scientifique",
    detail: "3 membres",
  },
  {
    icon: FaBullhorn,
    label: "Commission communication",
    detail: "À constituer",
    muted: true,
  },
  {
    icon: FaHandshake,
    label: "Commission partenariat & financement",
    detail: "Structure opérationnelle",
  },
];

export default function OrganigrammeSection() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Organes de la SOCAphy
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Structure de gouvernance et répartition des responsabilités
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Assemblée Générale — structure */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FaUsers />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Assemblée Générale
                </h3>
                <p className="text-xs text-gray-500">Organe suprême</p>
              </div>
            </div>

            {/* Bureau exécutif */}
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bureau Exécutif
              </h4>
              <ul className="space-y-2">
                {EXECUTIVE.map(({ icon: Icon, label, detail }) => (
                  <li
                    key={label}
                    className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-gray-100"
                  >
                    <Icon className="mt-0.5 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Commissions */}
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Commissions techniques
              </h4>
              <ul className="space-y-2">
                {COMMISSIONS.map(({ icon: Icon, label, detail, muted }) => (
                  <li
                    key={label}
                    className="flex items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-gray-100"
                  >
                    <Icon
                      className={`mt-0.5 shrink-0 ${
                        muted ? "text-gray-400" : "text-emerald-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          muted ? "text-gray-500" : "text-gray-900"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-gray-500">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Commissaire aux comptes */}
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3">
              <FaGavel className="mt-0.5 shrink-0 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Commissaire aux comptes
                </p>
                <p className="text-xs text-orange-700">
                  Contrôle indépendant — à pourvoir
                </p>
              </div>
            </div>
          </div>

          {/* Assemblée Générale — fonctionnement */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <FaSitemap />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Fonctionnement
                </h3>
                <p className="text-xs text-gray-500">Règles et sessions</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              Réunit l'ensemble des membres une fois par an en session
              ordinaire. Elle fixe les orientations, approuve les rapports
              moral et financier, vote le budget, élit le Bureau Exécutif et le
              Commissaire aux comptes, et statue sur les modifications
              statutaires.
            </p>

            <div className="mt-6">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Règles de fonctionnement
              </h4>
              <ul className="space-y-2">
                <RuleItem>
                  Quorum : la moitié des membres à jour de cotisation
                </RuleItem>
                <RuleItem>
                  Décisions à la majorité simple des présents
                </RuleItem>
                <RuleItem>
                  Session extraordinaire sur convocation du Président ou du
                  tiers des membres
                </RuleItem>
              </ul>
            </div>

            <div className="mt-6 rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Rattachements
              </p>
              <p className="mt-1 text-sm text-emerald-900">
                Bureau Exécutif · Commissaire aux comptes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RuleItem({ children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      <span>{children}</span>
    </li>
  );
}