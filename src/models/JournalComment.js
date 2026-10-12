// src/models/JournalComment.js
import mongoose from "mongoose";

const JournalCommentSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalArticle",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalComment",
      default: null,
    },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["published", "hidden", "deleted"],
      default: "published",
      index: true,
    },
    flagCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

JournalCommentSchema.index({ article: 1, parent: 1, createdAt: 1 });

export default mongoose.models.JournalComment ||
  mongoose.model("JournalComment", JournalCommentSchema);
