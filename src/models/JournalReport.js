// src/models/JournalReport.js
import mongoose from "mongoose";
import { REPORT_REASONS, REPORT_STATUS } from "@/lib/cjp";

const JournalReportSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: "JournalArticle", index: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "JournalComment", index: true },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: REPORT_REASONS.map((r) => r.value),
      required: true,
    },
    details: { type: String, trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: Object.keys(REPORT_STATUS),
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    resolutionNote: String,
    actionTaken: String,
  },
  { timestamps: true }
);

export default mongoose.models.JournalReport ||
  mongoose.model("JournalReport", JournalReportSchema);
