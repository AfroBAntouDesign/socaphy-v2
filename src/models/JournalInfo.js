// src/models/JournalInfo.js
import mongoose from "mongoose";

/**
 * Singleton document — there is only ONE JournalInfo in the DB.
 * Use the helper getJournalInfo() to fetch it safely.
 */
const JournalInfoSchema = new mongoose.Schema(
  {
    _key: { type: String, default: "singleton", unique: true },

    // Masthead
    shortName: { type: String, default: "CJP" },
    name: { type: String, required: true },
    tagline: { type: String },
    issn: { type: String, default: "XXXX-XXXX" },
    eissn: { type: String },
    frequency: { type: String, default: "Publication continue" },
    publisher: { type: String },
    foundedYear: Number,

    // Descriptions
    descriptionFR: { type: String, maxlength: 3000 },
    descriptionEN: { type: String, maxlength: 3000 },
    scopeFR: { type: String, maxlength: 3000 },
    scopeEN: { type: String, maxlength: 3000 },
    ethicsFR: { type: String, maxlength: 5000 },
    ethicsEN: { type: String, maxlength: 5000 },

    // Instructions for authors
    instructionsFR: { type: String, maxlength: 20000 },
    instructionsEN: { type: String, maxlength: 20000 },

    // Contact
    contactEmail: String,
    contactPhone: String,
    contactAddress: String,
    contactCity: String,
    contactCountry: String,

    // Visuals
    coverImage: String,
    logo: String,

    // Policies
    openAccess: { type: Boolean, default: true },
    peerReviewed: { type: Boolean, default: true },
    apc: { type: String }, // Article Processing Charge description

    // External links
    website: String,
    twitter: String,
    linkedin: String,
  },
  { timestamps: true }
);

export default mongoose.models.JournalInfo ||
  mongoose.model("JournalInfo", JournalInfoSchema);
