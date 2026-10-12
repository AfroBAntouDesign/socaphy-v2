// src/lib/nav-config.js
import {
  FaHome, FaUserPlus, FaIdCard, FaLightbulb, FaGlobe,
  FaUser, FaUsers, FaUsersCog, FaFileAlt, FaArchive,
  FaStore, FaFileSignature, FaUserCircle,
  FaUserShield, FaBook, FaExchangeAlt,
} from "react-icons/fa";
import { DISABLED_MODULES } from "./roles";

/* ── Shared items ─────────────────────────────────────────────────── */

const COMMON_PUBLIC = [
  ...(DISABLED_MODULES.community
    ? []
    : [{ href: "/users/communaute", label: "Communauté", icon: FaUsers }]),
  { href: "/publicSpace", label: "Articles publics", icon: FaFileAlt },
];

const COMMON_PRO = [
  { href: "/users/cv", label: "Mon CV", icon: FaFileSignature },
  { href: "/users/profile", label: "Mon profil", icon: FaUserCircle },
];

/* ── Guest sidebar ────────────────────────────────────────────────── */

export const GUEST_NAV = [
  { href: "/", label: "Accueil", icon: FaHome },
  { href: "/auth/register", label: "Créer un compte", icon: FaUserPlus },
  { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
];

/* ── Role → menu items ────────────────────────────────────────────── */

export const NAV_BY_ROLE = {
  /* ── SUPER ADMIN ─────────────────────────────────────────────── */
  superAdmin: [
    { href: "/adminDashboard", label: "SuperAdmin", icon: FaUser },
    { href: "/adminDashboard/manageUsers", label: "Utilisateurs", icon: FaUsersCog },
    { href: "/adminDashboard/manageMembers", label: "Membres SOCAphy", icon: FaUserShield },
    { href: "/adminDashboard/manageArticles", label: "Articles", icon: FaFileAlt },
    { href: "/adminDashboard/manageCv", label: "Validation CV", icon: FaIdCard },
    ...(DISABLED_MODULES.shop
      ? []
      : [{ href: "/adminDashboard/manageShops", label: "Boutiques", icon: FaStore }]),
    { href: "/adminDashboard/manageArchives", label: "Archives", icon: FaArchive },
    ...(DISABLED_MODULES.community
      ? []
      : [{ href: "/adminDashboard/manageCommunity", label: "Communauté", icon: FaUsers }]),
    { href: "/adminDashboard/manageCjp", label: "Journal CJP", icon: FaBook },
    { href: "/adminDashboard/manageCjp/partnership", label: "Partenariat CJP", icon: FaExchangeAlt },
    { href: "/users/profile", label: "Mon profil", icon: FaUserCircle },
    ...(DISABLED_MODULES.market
      ? []
      : [{ href: "/market", label: "Marché", icon: FaStore }]),
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
  ],

  /* ── MEMBRE SOCAPHY ──────────────────────────────────────────── */
  adminSOCAphy: [
    { href: "/users/adminSOCAphy", label: "Mon dashboard", icon: FaUser },
    { href: "/users/adminSOCAphy/articles", label: "Mes articles", icon: FaFileAlt },
    { href: "/users/adminSOCAphy/nouveau", label: "Nouvel article", icon: FaLightbulb },
    { href: "/users/cjp", label: "Journal CJP", icon: FaBook },
    { href: "/adminDashboard/manageArticles", label: "Validation articles", icon: FaArchive },
    { href: "/adminDashboard/manageCv", label: "Validation CV", icon: FaIdCard },
    ...COMMON_PRO,
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
    ...(DISABLED_MODULES.community
      ? []
      : [{ href: "/users/communaute", label: "Communauté", icon: FaUsers }]),
  ],

  /* ── SCIENTIFIQUE ────────────────────────────────────────────── */
  scientifique: [
    ...COMMON_PRO,
    { href: "/users/scientifique", label: "Dashboard Scientifique", icon: FaUser },
    { href: "/users/scientifique/articles", label: "Mes articles", icon: FaFileAlt },
    { href: "/users/cjp", label: "Journal CJP", icon: FaBook },
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
    ...(DISABLED_MODULES.community
      ? []
      : [{ href: "/users/communaute", label: "Communauté", icon: FaUsers }]),
  ],

  /* ── PATIENT ─────────────────────────────────────────────────── */
  patient: [
    { href: "/users/profile", label: "Mon profil", icon: FaUserCircle },
    { href: "/users/patient", label: "Dashboard Patient", icon: FaUser },
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
    ...(DISABLED_MODULES.market
      ? []
      : [{ href: "/market", label: "Marché", icon: FaStore }]),
  ],

  /* ── CURIEUX ─────────────────────────────────────────────────── */
  curieux: [
    { href: "/users/profile", label: "Mon profil", icon: FaUserCircle },
    { href: "/users/curieux", label: "Dashboard", icon: FaUser },
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
    ...(DISABLED_MODULES.market
      ? []
      : [{ href: "/market", label: "Marché", icon: FaStore }]),
  ],

  /* ── CLIENT ──────────────────────────────────────────────────── */
  client: [
    { href: "/users/profile", label: "Mon profil", icon: FaUserCircle },
    { href: "/users/client", label: "Dashboard Client", icon: FaUser },
    { href: "/publicSpace", label: "Place publique", icon: FaGlobe },
    ...(DISABLED_MODULES.market
      ? []
      : [{ href: "/market", label: "Marché", icon: FaStore }]),
  ],

  /* ── MODULES DÉSACTIVÉS — menus vides ────────────────────────── */
  clinic: [],
  praticienSante: [],
  tradiPraticien: [],
};
