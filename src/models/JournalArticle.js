// src/models/JournalArticle.js
import mongoose from "mongoose";
import { ARTICLE_SECTIONS, ARTICLE_STATUS } from "@/lib/cjp";

const AuthorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: String,
    affiliation: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    orcid: String,
    isCorresponding: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ReferenceSchema = new mongoose.Schema(
  {
    authors: String,
    year: String,
    title: String,
    journal: String,
    volume: String,
    issue: String,
    pages: String,
    doi: String,
    url: String,
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["pdf", "image", "docx", "doc", "odt", "xlsx", "csv", "other"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    originalName: String,
    size: Number,
    mimeType: String,
    label: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const JournalArticleSchema = new mongoose.Schema(
  {
    /* ── Identifiers ── */
    cjpId: { type: String, unique: true, index: true },
    doi: { type: String, trim: true, index: true, sparse: true },

    /* ── Title & abstract ── */
    title: { type: String, required: true, trim: true, maxlength: 300 },
    titleFR: { type: String, trim: true, maxlength: 300 },
    titleEN: { type: String, trim: true, maxlength: 300 },

    abstractFR: { type: String, maxlength: 3000 },
    abstractEN: { type: String, maxlength: 3000 },

    keywordsFR: { type: [String], default: [] },
    keywordsEN: { type: [String], default: [] },

    /* ── Authors ── */
    authors: { type: [AuthorSchema], default: [] },

    /* ── Classification ── */
    section: {
      type: String,
      enum: ARTICLE_SECTIONS.map((s) => s.value),
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ["fr", "en", "bilingual"],
      default: "fr",
    },

    /* ── Full text ── */
    introduction: String,
    methods: String,
    results: String,
    discussion: String,
    conclusion: String,
    acknowledgments: String,
    funding: String,
    conflictsOfInterest: String,
    dataAvailability: String,

    references: { type: [ReferenceSchema], default: [] },

    /* ── Files ── */
    attachments: { type: [AttachmentSchema], default: [] },
    figures: { type: [String], default: [] },

    /* ── Publication info ── */
    issue: { type: mongoose.Schema.Types.ObjectId, ref: "JournalIssue", index: true },
    pages: { type: String, trim: true },

    /* ── Workflow ── */
    status: {
      type: String,
      enum: Object.keys(ARTICLE_STATUS),
      default: "draft",
      index: true,
    },
    rejectionReason: String,
    internalNotes: String,

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submittedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    publishedAt: Date,

    /* ── Engagement ── */
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    citations: { type: Number, default: 0 },
    commentsEnabled: { type: Boolean, default: true },
    commentCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },

    /* ── Partnership with main app ── */
    partnership: {
      // Direction 1 : cet article CJP provient d'un Article de l'app
      sourceArticle: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
      submittedToCjpAt: Date,
      submittedToCjpBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      // Direction 2 : cet article CJP a été mis en avant sur /publicSpace
      publicArticle: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
      featuredInPublicSpaceAt: Date,
      featuredInPublicSpaceBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

JournalArticleSchema.index({ status: 1, publishedAt: -1 });

JournalArticleSchema.index(
  {
    "authors.name": "text",
    title: "text",
    abstractEN: "text",
    abstractFR: "text",
  },
  {
    language_override: "textSearchLanguage",
    default_language: "none",
  }
);

export default mongoose.models.JournalArticle ||
  mongoose.model("JournalArticle", JournalArticleSchema);
