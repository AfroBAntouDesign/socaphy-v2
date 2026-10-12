// scripts/seed-admin.mjs
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing. Run with --env-file=.env.local");
  process.exit(1);
}

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/seed-admin.mjs "Nom" email password');
  process.exit(1);
}

console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ Connected");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, lowercase: true, trim: true, unique: true },
    password: String,
    role: String,
    status: String,
    verified: Boolean,
  },
  { timestamps: true, strict: false }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const normalizedEmail = email.toLowerCase().trim();
const existing = await User.findOne({ email: normalizedEmail });

if (existing) {
  console.log("ℹ️  User already exists — nothing to do");
  console.log("   email: ", existing.email);
  console.log("   role:  ", existing.role);
  console.log("   status:", existing.status);
  await mongoose.disconnect();
  process.exit(0);
}

const hashed = await bcrypt.hash(password, 12);

const admin = await User.create({
  name: name.trim(),
  email: normalizedEmail,
  password: hashed,
  role: "superAdmin",
  status: "active",
  verified: true,
  verifiedAt: new Date(),
});

console.log("✅ SuperAdmin created");
console.log("   _id:  ", admin._id.toString());
console.log("   name: ", admin.name);
console.log("   email:", admin.email);
console.log("   role: ", admin.role);

await mongoose.disconnect();
console.log("🔌 Disconnected");