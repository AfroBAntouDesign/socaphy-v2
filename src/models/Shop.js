// src/models/Shop.js
import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one shop per user
      index: true,
    },

    // Contact & location
    phone: { type: String, trim: true, maxlength: 40 },
    email: { type: String, trim: true, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 80 },
    region: { type: String, trim: true, maxlength: 80 },

    openingHours: { type: String, trim: true, maxlength: 200 },
    licenseNumber: { type: String, trim: true, maxlength: 80 },

    // Branding
    logo: String,
    banner: String,

    // Denormalized counters (kept in sync by actions)
    productCount: { type: Number, default: 0 },
    activeProductCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "suspended", "archived"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

ShopSchema.index({ status: 1, createdAt: -1 });
ShopSchema.index({ name: "text", description: "text" });

export default mongoose.models.Shop || mongoose.model("Shop", ShopSchema);