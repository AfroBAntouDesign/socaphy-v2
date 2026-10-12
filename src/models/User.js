// src/models/User.js
import mongoose from "mongoose";
import { ROLES } from "@/lib/roles";

const ParcoursSchema = new mongoose.Schema(
  {
    annee: String,
    institution: String,
    mention: String,
    dateDebut: Date,
    dateFin: Date,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },

    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ROLES,
      required: true,
      index: true,
    },

    // ✅ Account lifecycle
    status: {
      type: String,
      enum: ["active", "pending", "rejected", "suspended"],
      default: "active",
      index: true,
    },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    rejectionReason: String,

    // Profile
    avatar: String,
    description: { type: String, maxlength: 500 },
    features: { type: [String], default: [] },
    biography: String,
    expertise: { type: [String], default: [] },
    parcours: { type: [ParcoursSchema], default: [] },

    // SOCAphy-specific
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic" },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ status: 1, role: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);