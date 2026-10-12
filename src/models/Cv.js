// src/models/Cv.js
import mongoose from "mongoose";

const CvSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    heading: { type: String, required: true, trim: true, maxlength: 200 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    profession: { type: String, trim: true, maxlength: 120 },
    summary: { type: String, trim: true, maxlength: 1500 },

    // Single attachment (the actual CV file)
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: String,

    status: {
      type: String,
      enum: ["submitted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,

    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

CvSchema.index({ user: 1, status: 1 });

export default mongoose.models.Cv || mongoose.model("Cv", CvSchema);