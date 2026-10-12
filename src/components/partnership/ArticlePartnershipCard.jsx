// src/components/partnership/ArticlePartnershipCard.jsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaBook, FaGlobe, FaPaperPlane, FaSpinner, FaCheckCircle,
  FaClock, FaTimesCircle, FaExternalLinkAlt,
} from "react-icons/fa";
import { canSubmitArticleToCjp } from "@/lib/partnership";

/**
 * Carte auteur unifiée : 2 flux (espace public + CJP).
 *
 * Props :
 *   article : {
 *     _id, title, status, profileType,
 *     partnership : {
 *       publicSpaceSubmissionStatus, publicSpaceRefusalReason,
 *       cjpSubmissionStatus, cjpRefusalReason, cjpArticle,
 *     }
 *   }
 */
export default function ArticlePartnershipCard({ article }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const partner = article.partnership || {};
  const publicStatus = partner.publicSpaceSubmissionStatus || "none";
  const cjpStatus = partner.cjpSubmissionStatus || "none";

  const isDraft = article.status !== "validated";
  const canPublic = !isDraft;
  const canCjp = canSubmitArticleToCjp(article.profileType);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const submitToPublicSpace = () => {
    if (!confirm("Soumettre cet article pour publication dans l'espace public ?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/articles/${article._id}/submit-to-public-space`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        showToast("success", data.message);
        router.refresh();
      } catch (err) {
        showToast("error", err.message);
      }
    });
  };

  const submitToCjp = () => {
    if (!confirm("Soumettre cet article au Cameroonian Journal of Phytotherapae ?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/articles/${article._id}/submit-to-cjp`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec");
        showToast("success", data.message);
        router.refresh();
      } catch (err) {
        showToast("error", err.message);
      }
    });
  };

  // Rien à afficher pour un brouillon sans historique
  if (isDraft && publicStatus === "none" && cjpStatus === "none") return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FaPaperPlane className="text-emerald-700" />
        <h3 className="font-serif text-base font-bold text-gray-900">
          Soumettre pour publication
        </h3>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Flux 1 : Espace public                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FaGlobe className="text-emerald-700" />
          <h4 className="text-sm font-semibold text-gray-900">Espace public</h4>
        </div>

        {publicStatus === "none" && canPublic && (
          <>
            <p className="mb-3 text-xs text-gray-600">
              Rendre cet article visible sur la place publique de la plateforme.
            </p>
            <button
              type="button"
              onClick={submitToPublicSpace}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              Soumettre à l'espace public
            </button>
          </>
        )}

        {publicStatus === "pending" && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-orange-900">
              <FaClock /> En attente de validation
            </p>
            <p className="mt-1 text-xs text-orange-800">
              Votre article sera examiné par un administrateur.
            </p>
          </div>
        )}

        {publicStatus === "approved" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
              <FaCheckCircle /> Publié dans l'espace public
            </p>
            <Link
              href={`/publicSpace/${article._id}`}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Voir la publication <FaExternalLinkAlt className="text-[10px]" />
            </Link>
          </div>
        )}

        {publicStatus === "refused" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-red-900">
              <FaTimesCircle /> Refusé
            </p>
            {partner.publicSpaceRefusalReason && (
              <p className="mt-1 text-xs text-red-800">
                Motif : {partner.publicSpaceRefusalReason}
              </p>
            )}
            {canPublic && (
              <button
                type="button"
                onClick={submitToPublicSpace}
                disabled={pending}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                Resoumettre
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Flux 2 : CJP (pour les rôles auteurs)                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {canCjp && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <FaBook className="text-emerald-700" />
            <h4 className="text-sm font-semibold text-gray-900">Journal CJP</h4>
          </div>

          {cjpStatus === "none" && canPublic && (
            <>
              <p className="mb-3 text-xs text-gray-600">
                Soumettre au comité scientifique du Cameroonian Journal of Phytotherapae.
              </p>
              <button
                type="button"
                onClick={submitToCjp}
                disabled={pending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                Soumettre au CJP
              </button>
            </>
          )}

          {cjpStatus === "pending" && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-orange-900">
                <FaClock /> En attente de validation CJP
              </p>
            </div>
          )}

          {cjpStatus === "approved" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
                <FaCheckCircle /> Publié au CJP
              </p>
              {partner.cjpArticle && (
                <Link
                  href={`/cjp/articles/${partner.cjpArticle}`}
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Voir la publication CJP <FaExternalLinkAlt className="text-[10px]" />
                </Link>
              )}
            </div>
          )}

          {cjpStatus === "refused" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-red-900">
                <FaTimesCircle /> Refusé par le CJP
              </p>
              {partner.cjpRefusalReason && (
                <p className="mt-1 text-xs text-red-800">
                  Motif : {partner.cjpRefusalReason}
                </p>
              )}
              {canPublic && (
                <button
                  type="button"
                  onClick={submitToCjp}
                  disabled={pending}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {pending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                  Resoumettre
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-md px-3 py-2 text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
