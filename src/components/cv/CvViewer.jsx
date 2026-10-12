// src/components/cv/CvViewer.jsx
"use client";

import { useState } from "react";
import {
  FaEye, FaPrint, FaDownload, FaTimes, FaExternalLinkAlt,
  FaFileAlt, FaSpinner,
} from "react-icons/fa";

/**
 * Opens the CV in a modal for reading.
 * Props:
 *   cv: { fileUrl, fileName, fileType }
 *   children: the trigger content (defaults to an "Aperçu" button)
 *   variant: "button" | "icon" | "link"
 */
export default function CvViewer({ cv, children, variant = "button" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {children}
        </span>
      ) : (
        <TriggerButton variant={variant} onClick={() => setOpen(true)} />
      )}

      {open && <ViewerModal cv={cv} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Trigger button variants                                         */
/* ═══════════════════════════════════════════════════════════════ */

function TriggerButton({ variant, onClick }) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
        title="Aperçu"
        aria-label="Aperçu du CV"
      >
        <FaEye />
      </button>
    );
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        Voir le CV
      </button>
    );
  }

  // Default: button
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
    >
      <FaEye /> Ouvrir
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Modal                                                           */
/* ═══════════════════════════════════════════════════════════════ */

function ViewerModal({ cv, onClose }) {
  const [loading, setLoading] = useState(true);
  const isPdf = cv.fileType === "pdf";
  const isImage = cv.fileType === "image";
  const canPreview = isPdf || isImage;

  const print = () => {
    const w = window.open(cv.fileUrl, "_blank");
    if (w) w.addEventListener("load", () => w.print?.(), { once: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FaFileAlt className="shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {cv.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {cv.fileType?.toUpperCase()}
                {cv.fileSize && ` · ${(cv.fileSize / 1024).toFixed(0)} Ko`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={print}
              className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
              title="Imprimer"
              aria-label="Imprimer"
            >
              <FaPrint />
            </button>
            <a
              href={cv.fileUrl}
              download={cv.fileName}
              className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
              title="Télécharger"
              aria-label="Télécharger"
            >
              <FaDownload />
            </a>
            <a
              href={cv.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
              title="Ouvrir dans un nouvel onglet"
              aria-label="Ouvrir dans un nouvel onglet"
            >
              <FaExternalLinkAlt />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 rounded-md p-2 text-gray-600 transition hover:bg-gray-100"
              title="Fermer"
              aria-label="Fermer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden bg-gray-100">
          {loading && canPreview && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <FaSpinner className="animate-spin text-3xl text-emerald-600" />
                <p className="text-sm">Chargement du document…</p>
              </div>
            </div>
          )}

          {isPdf && (
            <iframe
              src={cv.fileUrl}
              title={cv.fileName}
              onLoad={() => setLoading(false)}
              className="h-full w-full"
            />
          )}

          {isImage && (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cv.fileUrl}
                alt={cv.fileName}
                onLoad={() => setLoading(false)}
                className="max-h-full max-w-full rounded-lg bg-white object-contain shadow"
              />
            </div>
          )}

          {!canPreview && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <FaFileAlt className="text-5xl text-gray-400" />
              <div>
                <p className="font-medium text-gray-800">
                  Aperçu non disponible
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Les fichiers {cv.fileType?.toUpperCase()} ne peuvent pas être
                  prévisualisés dans le navigateur.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={cv.fileUrl}
                  download={cv.fileName}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <FaDownload /> Télécharger le fichier
                </a>
                <a
                  href={cv.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <FaExternalLinkAlt /> Ouvrir dans un onglet
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}