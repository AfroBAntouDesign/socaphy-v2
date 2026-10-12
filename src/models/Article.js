// src/models/Article.js
import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "audio", "pdf", "word", "odt", "excel", "powerpoint", "text", "document"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    description: String,
    size: Number,
    mimeType: String,
  },
  { _id: false }
);

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },

    profileType: { type: String, required: true, index: true },

    kind: {
      type: String,
      enum: ["scientific", "practical"],
      required: true,
      index: true,
    },

    /* ── Scientific fields ── */
    abstract: { type: String, maxlength: 2000 },
    introduction: String,
    methods: String,
    results: String,
    discussion: String,
    references: { type: [String], default: [] },

    /* ── Practical fields ── */
    ingredient: String,
    description: String,
    advantages: String,
    sideEffects: String,
    region: String,
    usage: String,
    precautions: String,

    /* ── Workflow ── */
    status: {
      type: String,
      enum: ["draft", "submitted", "validated", "rejected", "archived"],
      default: "draft",
      index: true,
    },
    rejectionReason: String,
    submittedAt: Date,
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    validatedAt: Date,

    /* ── Meta ── */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: { type: [String], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },

    /* ── Partnership with CJP ── */
    partnership: {
      // Direction 1 : cet Article a été soumis au CJP
      cjpSubmissionStatus: {
        type: String,
        enum: ["none", "pending", "approved", "refused"],
        default: "none",
        index: true,
      },
      cjpSubmittedAt: Date,
      cjpSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      cjpRefusalReason: String,
      cjpArticle: { type: mongoose.Schema.Types.ObjectId, ref: "JournalArticle" },
      cjpDecidedAt: Date,
      cjpDecidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      // Direction 2 : cet Article provient d'une publication CJP
      sourceJournalArticle: { type: mongoose.Schema.Types.ObjectId, ref: "JournalArticle" },
      sourcedFromCjpAt: Date,
    },
  },
  { timestamps: true }
);

ArticleSchema.index({ status: 1, createdAt: -1 });
ArticleSchema.index({ user: 1, status: 1 });
ArticleSchema.index({ kind: 1, status: 1 });
ArticleSchema.index({ title: "text", abstract: "text", description: "text" });

export default mongoose.models.Article ||
  mongoose.model("Article", ArticleSchema);
