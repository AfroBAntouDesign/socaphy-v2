// src/models/CommunityPost.js
import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "audio", "pdf", "word", "odt", "excel", "powerpoint", "text", "document"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    originalName: String,
    size: Number,
    mimeType: String,
  },
  { _id: false }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },

    attachments: { type: [AttachmentSchema], default: [] },

    status: {
      type: String,
      enum: ["published", "hidden", "deleted"],
      default: "published",
      index: true,
    },
    pinned: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CommunityPostSchema.index({ community: 1, status: 1, createdAt: -1 });
CommunityPostSchema.index({ pinned: -1, createdAt: -1 });

export default mongoose.models.CommunityPost ||
  mongoose.model("CommunityPost", CommunityPostSchema);