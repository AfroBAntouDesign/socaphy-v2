// src/lib/partnership.js

/** Status of an article submitted from the main app to CJP. */
export const CJP_SUBMISSION_STATUS = {
  none: { label: "Non soumis", pill: "bg-gray-100 text-gray-700 ring-gray-200" },
  pending: { label: "En attente CJP", pill: "bg-orange-50 text-orange-700 ring-orange-200" },
  approved: { label: "Publié au CJP", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  refused: { label: "Refusé par le CJP", pill: "bg-red-50 text-red-700 ring-red-200" },
};

/** Roles that can submit their article to CJP. */
export const CJP_SUBMITTER_ROLES = [
  "scientifique",
  "adminSOCAphy",
  "clinic",
  "praticienSante",
  "tradiPraticien",
];

export function canSubmitArticleToCjp(role) {
  return CJP_SUBMITTER_ROLES.includes(role);
}

/**
 * Convert a main-app Article into a JournalArticle payload.
 * Copies content so both documents stay autonomous.
 */
export function articleToJournalPayload(article, userId) {
  const isPractical = article.kind === "practical";

  // Simple author fallback — the real author info comes from populated user
  const authors = [
    {
      name: article.authorName || "Auteur principal",
      affiliation: article.authorAffiliation || "",
      email: article.authorEmail || "",
      isCorresponding: true,
      order: 0,
    },
  ];

  return {
    title: article.title,
    titleFR: article.kind === "scientific" ? article.title : "",
    titleEN: "",
    abstractFR: article.abstract || article.description || "",
    abstractEN: "",

    section: isPractical ? "short_communication" : "original_research",
    language: "fr",

    keywordsFR: article.tags || [],
    keywordsEN: [],

    authors,

    introduction: article.introduction || "",
    methods: article.methods || "",
    results: article.results || "",
    discussion: article.discussion || "",
    conclusion: "",

    references: (article.references || []).map((r) => {
      // If reference is a plain string, store it as "title"
      if (typeof r === "string") {
        return { title: r };
      }
      return {
        authors: r.authors || "",
        year: r.year || "",
        title: r.title || "",
        journal: r.journal || "",
        volume: r.volume || "",
        issue: r.issue || "",
        pages: r.pages || "",
        doi: r.doi || "",
        url: r.url || "",
      };
    }),

    attachments: (article.attachments || []).map((a) => ({
      type: a.type,
      fileUrl: a.fileUrl,
      originalName: a.description || a.originalName || "Document",
      size: a.size,
      mimeType: a.mimeType,
      label: "Manuscript",
    })),

    // Cross-reference (Mongoose dotted path)
    "partnership.sourceArticle": article._id,
    "partnership.submittedToCjpAt": new Date(),
    "partnership.submittedToCjpBy": userId,
  };
}

/**
 * Convert a JournalArticle into a main-app Article payload.
 * Used when featuring a CJP publication in /publicSpace.
 */
export function journalToArticlePayload(journalArticle, userId) {
  const authorNames = (journalArticle.authors || [])
    .map((a) => a.name)
    .join(", ");

  // Convert references array of objects → array of strings
  const referenceStrings = (journalArticle.references || []).map((r) => {
    const parts = [];
    if (r.authors) parts.push(r.authors);
    if (r.year) parts.push(`(${r.year})`);
    if (r.title) parts.push(r.title);
    if (r.journal) parts.push(r.journal);
    if (r.volume) parts.push(`vol. ${r.volume}`);
    if (r.issue) parts.push(`no. ${r.issue}`);
    if (r.pages) parts.push(`pp. ${r.pages}`);
    if (r.doi) parts.push(`doi:${r.doi}`);
    if (r.url) parts.push(r.url);
    return parts.join(". ");
  });

  // Tags = keywords FR + EN + CJP metadata
  const tags = [
    ...(journalArticle.keywordsFR || []),
    ...(journalArticle.keywordsEN || []),
    "CJP",
    journalArticle.cjpId,
  ].filter(Boolean);

  return {
    title: journalArticle.title,
    kind: "scientific",

    abstract: journalArticle.abstractFR || journalArticle.abstractEN || "",
    introduction: journalArticle.introduction || "",
    methods: journalArticle.methods || "",
    results: journalArticle.results || "",
    discussion: journalArticle.discussion || "",
    references: referenceStrings,

    // Author metadata flattened
    authorName: authorNames,
    authorAffiliation:
      (journalArticle.authors || []).find((a) => a.isCorresponding)?.affiliation || "",

    tags,

    attachments: (journalArticle.attachments || []).map((a) => ({
      type: a.type,
      fileUrl: a.fileUrl,
      description: a.label || a.originalName || "Document",
      size: a.size,
      mimeType: a.mimeType,
    })),

    // Cross-reference
    "partnership.sourceJournalArticle": journalArticle._id,
    "partnership.sourcedFromCjpAt": new Date(),
  };
}
