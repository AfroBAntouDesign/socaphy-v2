// scripts/migrate-status.mjs
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing. Run with --env-file=.env.local");
  process.exit(1);
}

console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ Connected");

const users = mongoose.connection.collection("users");

/* ------------------------------------------------------------------
 * One-time migration:
 *
 * Any user created before we added the `status` field has
 * `status: undefined` in the DB. Mongoose fills the default for new
 * documents, but NOT for existing ones. This backfills them so:
 *   - login status checks work
 *   - admin dashboard filters don't miss anyone
 * ------------------------------------------------------------------ */

const statusResult = await users.updateMany(
  { status: { $exists: false } },
  {
    $set: {
      status: "active",
      verified: true,
    },
  }
);

console.log("");
console.log("✅ Status backfill complete");
console.log("   matched:  ", statusResult.matchedCount);
console.log("   modified: ", statusResult.modifiedCount);

/* ------------------------------------------------------------------
 * Also fix any users with French plural role names that drifted
 * during early development (safe to run even if none exist).
 * ------------------------------------------------------------------ */

const roleFixes = [
  { from: "clients", to: "client" },
  { from: "visiteurs", to: "visiteur" },
  { from: "Praticien traditionnel", to: "tradiPraticien" },
  { from: "Membre SOCAphy", to: "adminSOCAphy" },
];

for (const fix of roleFixes) {
  const r = await users.updateMany(
    { role: fix.from },
    { $set: { role: fix.to } }
  );
  if (r.modifiedCount > 0) {
    console.log(`   role fix: "${fix.from}" → "${fix.to}" (${r.modifiedCount})`);
  }
}

/* ------------------------------------------------------------------
 * Report: show every user's email, role, status
 * ------------------------------------------------------------------ */

const all = await users
  .find({}, { projection: { email: 1, role: 1, status: 1, verified: 1 } })
  .toArray();

console.log("");
console.log(`📊 ${all.length} user(s) in database:`);
for (const u of all) {
  console.log(
    `   ${u.email.padEnd(35)} | ${String(u.role).padEnd(16)} | ${String(u.status ?? "—").padEnd(10)} | verified: ${u.verified ?? false}`
  );
}

await mongoose.disconnect();
console.log("");
console.log("🔌 Disconnected");