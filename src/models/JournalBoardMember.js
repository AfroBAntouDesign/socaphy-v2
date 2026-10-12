// src/models/JournalBoardMember.js
import mongoose from "mongoose";
import { BOARD_ROLES } from "@/lib/cjp";

const JournalBoardMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    title: { type: String, trim: true, maxlength: 80 }, // Prof., Dr., PhD
    role: {
      type: String,
      enum: BOARD_ROLES.map((r) => r.value),
      required: true,
      index: true,
    },
    affiliation: { type: String, trim: true, maxlength: 300 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    orcid: { type: String, trim: true, maxlength: 40 },
    photo: String,
    biography: { type: String, maxlength: 2000 },

    // Optional link to a User account
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

JournalBoardMemberSchema.index({ role: 1, order: 1 });

export default mongoose.models.JournalBoardMember ||
  mongoose.model("JournalBoardMember", JournalBoardMemberSchema);
