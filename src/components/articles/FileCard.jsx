// src/components/articles/FileCard.jsx
"use client";

import { useRef, useState } from "react";
import {
  FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileImage,
  FaFileAlt, FaEye, FaPrint, FaSync, FaTrash, FaSpinner, FaTimes,
} from "react-icons/fa";

const ICONS = {
  pdf: FaFilePdf,
  word: FaFileWord,
  excel: FaFileExcel,
  powerpoint: FaFilePowerpoint,
  image: FaFileImage,
  text: FaFileAlt,
  odt: FaFileAlt,
  document: FaFileAlt,
};

export default function FileCard({ file, index, articleId, editable, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const Icon = ICONS[file.type] || FaFileAlt;

  const replace = async (newFile) => {
    if (!newFile) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", newFile);

      const res = await fetch(
        `/api/articles/${articleId}/attachments?index=${index}`,
        { method: "PUT", body: fd, credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remplacement échoué");
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer "${file.originalName}" ?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/articles/${articleId}/attachments?index=${index}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression échouée");
      onChange?.();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const openInNewTab = () => window.open(file.fileUrl, "_blank");
  const print = () => {
    const w = window.open(file.fileUrl, "_blank");
    if (w) w.addEventListener("load", () => w.print?.(), { once: true });
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon className="text-xl" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {file.originalName || file.storedName}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {file.type.toUpperCase()} · {(file.size / 1024).toFixed(0)} Ko
            </p>
          </div>

          {busy && <FaSpinner className="animate-spin text-emerald-600" />}
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
          <ActionButton icon={FaEye} label="Aperçu" onClick={() => setPreview(true)} />
          <ActionButton icon={FaFileAlt} label="Ouvrir" onClick={openInNewTab} />
          <ActionButton icon={FaPrint} label="Imprimer" onClick={print} />

          {editable && (
            <>
              <ActionButton
                icon={FaSync}
                label="Remplacer"
                onClick={() => inputRef.current?.click()}
              />
              <ActionButton
                icon={FaTrash}
                label="Supprimer"
                danger
                onClick={remove}
              />
            </>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => replace(e.target.files?.[0])}
          accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif"
        />
      </div>

      {preview && (
        <PreviewModal file={file} onClose={() => setPreview(false)} onPrint={print} />
      )}
    </>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
        danger
          ? "text-red-700 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon /> {label}
    </button>
  );
}

/* ── Preview modal ────────────────────────────────────────────────── */

function PreviewModal({ file, onClose, onPrint }) {
  const isImage = file.type === "image";
  const isPdf = file.type === "pdf";
  const isText = file.type === "text";
  const openable = isPdf || isImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <p className="truncate text-sm font-semibold text-gray-800">
            {file.originalName}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Imprimer"
            >
              <FaPrint />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Fermer"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isPdf && (
            <iframe
              src={file.fileUrl}
              className="h-[75vh] w-full rounded-lg bg-white"
              title={file.originalName}
            />
          )}

          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.fileUrl}
              alt={file.originalName}
              className="mx-auto max-h-[75vh] rounded-lg bg-white object-contain shadow"
            />
          )}

          {isText && <TextPreview url={file.fileUrl} />}

          {!openable && !isText && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <FaFileAlt className="text-5xl text-gray-400" />
              <p className="text-gray-600">
                L'aperçu n'est pas disponible pour ce type de fichier.
              </p>
              <a
                href={file.fileUrl}
                download={file.originalName}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Télécharger
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inline text preview ──────────────────────────────────────────── */

function TextPreview({ url }) {
  const [content, setContent] = useState("Chargement…");

  useState(() => {
    fetch(url)
      .then((r) => r.text())
      .then((t) => setContent(t.slice(0, 100000)))
      .catch(() => setContent("Impossible de charger le contenu."));
  });

  return (
    <pre className="whitespace-pre-wrap break-words rounded-lg bg-white p-5 text-sm leading-relaxed text-gray-800 shadow">
      {content}
    </pre>
  );
}