// src/components/articles/FileUploader.jsx
"use client";

import { useRef, useState } from "react";
import { FaCloudUploadAlt, FaFile, FaTimes, FaSpinner } from "react-icons/fa";

const MAX_SIZE_MB = 15;

export default function FileUploader({ onUploaded, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    setError("");
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");

      onUploaded(data.attachment);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    upload(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/40"
        } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <>
            <FaSpinner className="animate-spin text-3xl text-emerald-600" />
            <p className="text-sm font-medium text-gray-700">Envoi en cours…</p>
          </>
        ) : (
          <>
            <FaCloudUploadAlt className="text-4xl text-emerald-600" />
            <p className="text-sm font-medium text-gray-800">
              Glissez un fichier ici, ou{" "}
              <span className="text-emerald-700 underline">parcourir</span>
            </p>
            <p className="text-xs text-gray-500">
              PDF, Word, ODT, Excel, PowerPoint, texte, image — max {MAX_SIZE_MB} Mo
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => upload(e.target.files?.[0])}
          accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp,.gif"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FaTimes /> {error}
        </div>
      )}
    </div>
  );
}