// src/lib/cjp.js

/* ────────────────────────────────────────────────────────────────── */
/*  Roles authorized to submit to the journal                          */
/* ────────────────────────────────────────────────────────────────── */

export const SUBMITTER_ROLES = [
  "superAdmin",
  "adminSOCAphy",
  "scientifique",
  "clinic",
  "praticienSante",
  "tradiPraticien",
];

export function canSubmitToJournal(role) {
  return SUBMITTER_ROLES.includes(role);
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sections                                                           */
/* ────────────────────────────────────────────────────────────────── */

export const ARTICLE_SECTIONS = [
  { value: "original_research", label: "Recherche originale", labelEN: "Original Research" },
  { value: "review", label: "Revue de littérature", labelEN: "Review" },
  { value: "case_study", label: "Étude de cas", labelEN: "Case Study" },
  { value: "short_communication", label: "Communication brève", labelEN: "Short Communication" },
  { value: "editorial", label: "Éditorial", labelEN: "Editorial" },
  { value: "letter", label: "Lettre à la rédaction", labelEN: "Letter to the Editor" },
];

export const SECTION_LABELS = Object.fromEntries(
  ARTICLE_SECTIONS.map((s) => [s.value, s.label])
);

/* ────────────────────────────────────────────────────────────────── */
/*  Article lifecycle                                                  */
/* ────────────────────────────────────────────────────────────────── */

export const ARTICLE_STATUS = {
  draft: { label: "Brouillon", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  submitted: { label: "Soumis", pill: "bg-blue-50 text-blue-700 ring-blue-200" },
  under_review: { label: "En évaluation", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  accepted: { label: "Accepté", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  published: { label: "Publié", pill: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  rejected: { label: "Refusé", pill: "bg-red-50 text-red-700 ring-red-200" },
  withdrawn: { label: "Retiré", pill: "bg-gray-100 text-gray-600 ring-gray-200" },
};

/* ────────────────────────────────────────────────────────────────── */
/*  Report reasons                                                     */
/* ────────────────────────────────────────────────────────────────── */

export const REPORT_REASONS = [
  { value: "plagiarism", label: "Plagiat" },
  { value: "misinformation", label: "Information trompeuse" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "spam", label: "Spam" },
  { value: "copyright", label: "Violation de droits d'auteur" },
  { value: "other", label: "Autre" },
];

export const REPORT_STATUS = {
  pending: { label: "En attente", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  reviewed: { label: "Examiné", pill: "bg-blue-50 text-blue-700 ring-blue-200" },
  dismissed: { label: "Rejeté", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  action_taken: { label: "Action prise", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

/* ────────────────────────────────────────────────────────────────── */
/*  Board member roles                                                 */
/* ────────────────────────────────────────────────────────────────── */

export const BOARD_ROLES = [
  { value: "editor_in_chief", label: "Éditeur en Chef", labelEN: "Editor in Chief" },
  { value: "editor", label: "Éditeur", labelEN: "Editor" },
  { value: "board_member", label: "Comité éditorial", labelEN: "Editorial Board" },
  { value: "secretariat", label: "Secrétariat", labelEN: "Secretariat" },
];

export const BOARD_ROLE_LABELS = Object.fromEntries(
  BOARD_ROLES.map((r) => [r.value, r.label])
);

/* ────────────────────────────────────────────────────────────────── */
/*  ID generation                                                      */
/* ────────────────────────────────────────────────────────────────── */

/**
 * Format: CJP-YYYY-NNNN
 * Example: CJP-2026-0001
 *
 * NNNN is a sequence per year — computed at creation time from a counter.
 */
export function formatCjpId(year, seq) {
  const padded = String(seq).padStart(4, "0");
  return `CJP-${year}-${padded}`;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Default journal info (fallback if DB empty)                        */
/* ────────────────────────────────────────────────────────────────── */

export const DEFAULT_JOURNAL_INFO = {
  shortName: "CJP",
  name: "Cameroonian Journal of Phytotherapae",
  tagline: "An official publication of the Cameroonian Society of Phytotherapy",
  issn: "XXXX-XXXX",
  frequency: "Publication continue",
  publisher: "Cameroonian Society of Phytotherapy (SOCAphy)",
  contactCity: "Yaoundé",
  contactCountry: "Cameroun",
  contactEmail: "contact@cjp.cm",
  openAccess: true,
  peerReviewed: true,
};
