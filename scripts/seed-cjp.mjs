// scripts/seed-cjp.mjs
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing. Run with --env-file=.env.local");
  process.exit(1);
}

console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ Connected");

/* ── Schémas minimalistes (strict: false) ─────────────────────── */

const InfoSchema = new mongoose.Schema(
  { _key: { type: String, default: "singleton", unique: true } },
  { timestamps: true, strict: false }
);
const BoardSchema = new mongoose.Schema({}, { timestamps: true, strict: false });
const IssueSchema = new mongoose.Schema({}, { timestamps: true, strict: false });

const JournalInfo = mongoose.models.JournalInfo || mongoose.model("JournalInfo", InfoSchema);
const JournalBoardMember = mongoose.models.JournalBoardMember || mongoose.model("JournalBoardMember", BoardSchema);
const JournalIssue = mongoose.models.JournalIssue || mongoose.model("JournalIssue", IssueSchema);

/* ── 1. Infos du journal ──────────────────────────────────────── */

const existingInfo = await JournalInfo.findOne({ _key: "singleton" });

if (!existingInfo) {
  const info = await JournalInfo.create({
    _key: "singleton",
    shortName: "CJP",
    name: "Cameroonian Journal of Phytotherapae",
    tagline:
      "An official publication of the Cameroonian Society of Phytotherapy",
    issn: "XXXX-XXXX",
    frequency: "Publication continue",
    publisher: "Cameroonian Society of Phytotherapy (SOCAphy)",
    contactEmail: "contact@cjp.cm",
    contactCity: "Yaoundé",
    contactCountry: "Cameroun",
    openAccess: true,
    peerReviewed: true,
    descriptionFR:
      "Le Cameroonian Journal of Phytotherapae (CJP) est la revue scientifique officielle de la Société Camerounaise de Phytothérapie (SOCAphy). Il publie des travaux originaux, des revues et des communications courtes portant sur tous les aspects scientifiques de la phytothérapie : ethnobotanique, phytochimie, pharmacognosie, pharmacologie, essais cliniques et santé publique.",
    descriptionEN:
      "The Cameroonian Journal of Phytotherapae (CJP) is the official scientific journal of the Cameroonian Society of Phytotherapy (SOCAphy). It publishes original research, reviews and short communications covering all scientific aspects of phytotherapy: ethnobotany, phytochemistry, pharmacognosy, pharmacology, clinical trials and public health.",
    scopeFR:
      "Le CJP couvre les domaines suivants :\n- Ethnobotanique et savoirs traditionnels\n- Phytochimie et pharmacognosie\n- Pharmacologie et toxicologie des plantes médicinales\n- Essais cliniques et évaluation thérapeutique\n- Santé publique et politiques de santé\n- Conservation de la biodiversité médicinale",
    scopeEN:
      "The CJP covers the following areas:\n- Ethnobotany and traditional knowledge\n- Phytochemistry and pharmacognosy\n- Pharmacology and toxicology of medicinal plants\n- Clinical trials and therapeutic evaluation\n- Public health and health policy\n- Medicinal biodiversity conservation",
    instructionsFR:
      "INSTRUCTIONS AUX AUTEURS\n\nLes instructions pour les auteurs souhaitant soumettre un article au Cameroonian Journal of Phytotherapae (CJP) se trouvent à la fin de chaque numéro. Ces instructions sont publiées alternativement en français ou en anglais d'un numéro à l'autre. Le respect strict de ces instructions est requis avant toute considération pour évaluation et/ou publication.",
    instructionsEN:
      "INSTRUCTIONS FOR AUTHORS\n\nInstructions for authors wishing to submit articles to the Cameroonian Journal of Phytotherapae (CJP) may be found at the end of each issue. These instructions are published alternately either in French or English from issue to issue. Strict adherence to these instructions is required prior to any consideration for review and/or publication.",
  });
  console.log("✅ JournalInfo créé :", info.name);
} else {
  console.log("ℹ️  JournalInfo existe déjà — rien à faire");
}

/* ── 2. Comité éditorial ──────────────────────────────────────── */

const BOARD = [
  // Éditeur en Chef
  { name: "NGOUPAYO Joseph", role: "editor_in_chief", order: 0 },

  // Éditeurs
  { name: "NGOUPAYO Joseph", role: "editor", order: 1 },
  { name: "FOKUNANG T. Charles", role: "editor", order: 2 },
  { name: "PIEME Constant Anatole", role: "editor", order: 3 },
  { name: "TABOPDA K. Turibio", role: "editor", order: 4 },

  // Comité éditorial
  { name: "TAKOUGANG Innocent", role: "board_member", order: 10 },
  { name: "TABOPDA K. Turibio", role: "board_member", order: 11 },
  { name: "PANGOP K. Alain Cyr", role: "board_member", order: 12 },
  { name: "TEMBE Estella", role: "board_member", order: 13 },
  { name: "TCHINDA T. Alambert", role: "board_member", order: 14 },
  { name: "CHELEA MATCHAWE", role: "board_member", order: 15 },
  { name: "TCHAMGOUE Armelle", role: "board_member", order: 16 },
  { name: "NGAMO T. Léonard", role: "board_member", order: 17 },
  { name: "BODA Maurice", role: "board_member", order: 18 },

  // Secrétariat
  { name: "CHEWA", role: "secretariat", order: 20 },
];

let created = 0;
let skipped = 0;

for (const member of BOARD) {
  const exists = await JournalBoardMember.findOne({
    name: member.name,
    role: member.role,
  });
  if (exists) {
    skipped++;
    continue;
  }
  await JournalBoardMember.create({ ...member, isActive: true });
  created++;
}

console.log(`✅ Membres du comité : ${created} créés, ${skipped} déjà présents`);

/* ── 3. Volume 1 / Numéro 1 (upcoming) ────────────────────────── */

const existingIssue = await JournalIssue.findOne({ volume: 1, number: 1 });
if (!existingIssue) {
  await JournalIssue.create({
    volume: 1,
    number: 1,
    year: new Date().getFullYear(),
    slug: "vol-1-no-1",
    title: "Volume inaugural",
    status: "current",
  });
  console.log("✅ Volume 1, No. 1 créé");
} else {
  console.log("ℹ️  Volume 1, No. 1 existe déjà");
}

/* ─────────────────────────────────────────────────────────────── */

await mongoose.disconnect();
console.log("");
console.log("🔌 Disconnected");
console.log("✅ Seed CJP terminé");
