// src/components/cjp/Masthead.jsx
import { FaBookOpen } from "react-icons/fa";
import { DEFAULT_JOURNAL_INFO } from "@/lib/cjp";

export default function Masthead({ info, compact = false }) {
  const j = info || DEFAULT_JOURNAL_INFO;

  return (
    <header className="border-b border-gray-200 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-10"}`}>
          {/* Logo/Icon */}
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm">
            <FaBookOpen className="text-2xl" />
          </div>

          {/* Journal name */}
          <h1
            className={`font-serif font-bold leading-tight text-white${
              compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"
            }`}
          >
            {j.name}
          </h1>

          {/* Tagline */}
          {j.tagline && (
            <p className="mt-2 max-w-2xl text-sm italic text-gray-600 sm:text-base">
              {j.tagline}
            </p>
          )}

          {/* Meta bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>
              ISSN : <strong className="text-gray-700">{j.issn}</strong>
            </span>
            {j.frequency && (
              <>
                <span aria-hidden>·</span>
                <span>{j.frequency}</span>
              </>
            )}
            {j.openAccess && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-emerald-700">Open Access</span>
              </>
            )}
            {j.peerReviewed && (
              <>
                <span aria-hidden>·</span>
                <span>Peer-reviewed</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
