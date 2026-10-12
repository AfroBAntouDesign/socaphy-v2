// src/models/Community.js
import mongoose from "mongoose";

const COMMUNITY_CATEGORIES = [
  "treatment",   // traitement d'une maladie
  "practice",    // pratique traditionnelle
  "product",     // produits naturels
  "academic",    // recherche scientifique
  "other",
];

const CommunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
      index: true,
    },
    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },

    description: { type: String, required: true, trim: true, maxlength: 500 },
    theme: { type: String, trim: true, maxlength: 200 },
    rules: { type: String, trim: true, maxlength: 3000 },

    category: {
      type: String,
      enum: COMMUNITY_CATEGORIES,
      default: "other",
      index: true,
    },

    isPublic: { type: Boolean, default: true },

    coverImage: String,
    avatar: String,

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Denormalized for fast listing
    memberCount: { type: Number, default: 1, index: true },
    postCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "archived"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

CommunitySchema.index({ status: 1, memberCount: -1 });
CommunitySchema.index({ name: "text", description: "text", theme: "text" });

export const CATEGORIES = COMMUNITY_CATEGORIES;

export default mongoose.models.Community ||
  mongoose.model("Community", CommunitySchema);