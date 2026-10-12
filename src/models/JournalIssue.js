// src/models/JournalIssue.js
import mongoose from "mongoose";

const JournalIssueSchema = new mongoose.Schema(
  {
    volume: { type: Number, required: true, min: 1 },
    number: { type: Number, required: true, min: 1 },
    year: { type: Number, required: true, min: 2000 },

    title: { type: String, trim: true, maxlength: 200 },
    editorial: { type: String, maxlength: 5000 }, // Éditorial du numéro

    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },

    publishDate: Date,
    coverImage: String,

    status: {
      type: String,
      enum: ["upcoming", "current", "archived"],
      default: "upcoming",
      index: true,
    },

    articleCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

JournalIssueSchema.index({ volume: -1, number: -1 });

export default mongoose.models.JournalIssue ||
  mongoose.model("JournalIssue", JournalIssueSchema);
