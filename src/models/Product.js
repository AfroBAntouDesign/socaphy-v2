// src/models/Product.js
import mongoose from "mongoose";
import { PRODUCT_CATEGORIES } from "@/lib/marketplace";

const ProductSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },

    category: {
      type: String,
      enum: PRODUCT_CATEGORIES.map((c) => c.value),
      required: true,
      index: true,
    },

    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "XAF" },
    unit: { type: String, trim: true, maxlength: 40 }, // "100g", "250ml", etc.
    stock: { type: Number, default: 0, min: 0 },

    images: { type: [String], default: [] },

    // Scientific backing (optional)
    linkedArticle: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    ingredients: { type: String, trim: true, maxlength: 1000 },
    usage: { type: String, trim: true, maxlength: 1000 },
    precautions: { type: String, trim: true, maxlength: 1000 },
    sideEffects: { type: String, trim: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "out_of_stock", "archived"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ shop: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ name: "text", description: "text" });

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);