// src/lib/uploads.js
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_MIME = {
  // Documents
  "application/pdf": "pdf",
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "word",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "application/vnd.ms-powerpoint": "powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "powerpoint",
  // Text
  "text/plain": "text",
  "text/markdown": "text",
  "text/csv": "text",
  // Images
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function detectFileType(mime) {
  return ALLOWED_MIME[mime] ?? null;
}

function sanitizeName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  Save                                                               */
/* ------------------------------------------------------------------ */

/**
 * Save an uploaded File to disk.
 * Returns metadata ready to store in the Article.attachments array.
 */
export async function saveUpload({ file, userId }) {
  if (!file || typeof file === "string") {
    throw new Error("Fichier manquant");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)`);
  }

  const type = detectFileType(file.type);
  if (!type) {
    throw new Error(`Type de fichier non autorisé : ${file.type}`);
  }

  const userDir = path.join(UPLOAD_ROOT, userId);
  await ensureDir(userDir);

  const ext = path.extname(file.name).toLowerCase() || ".bin";
  const base = sanitizeName(path.basename(file.name, ext));
  const unique = crypto.randomBytes(6).toString("hex");
  const storedName = `${base}_${unique}${ext}`;
  const fullPath = path.join(userDir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return {
    type,
    fileUrl: `/uploads/${userId}/${storedName}`,
    originalName: file.name,
    storedName,
    size: file.size,
    mimeType: file.type,
    uploadedAt: new Date(),
  };
}

/* ------------------------------------------------------------------ */
/*  Delete                                                             */
/* ------------------------------------------------------------------ */

/**
 * Delete a stored file. Safe to call even if the file is gone.
 * Pass the fileUrl from the attachment record.
 */
export async function deleteUpload(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return;

  // Reject anything that isn't under /uploads/
  if (!fileUrl.startsWith("/uploads/")) return;

  const relative = fileUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_ROOT, relative);

  // Prevent path traversal
  if (!fullPath.startsWith(UPLOAD_ROOT)) return;

  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("deleteUpload error:", err.message);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Read (for text preview)                                            */
/* ------------------------------------------------------------------ */

export async function readTextFile(fileUrl, maxBytes = 100_000) {
  if (!fileUrl?.startsWith("/uploads/")) throw new Error("Chemin invalide");

  const relative = fileUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_ROOT, relative);
  if (!fullPath.startsWith(UPLOAD_ROOT)) throw new Error("Chemin invalide");

  const buf = await fs.readFile(fullPath);
  return buf.slice(0, maxBytes).toString("utf8");
}