// src/lib/roles.js
export const ROLES = [
  "superAdmin",
  "adminSOCAphy",
  "scientifique",
  "praticienSante",
  "clinic",
  "tradiPraticien",
  "patient",
  "client",
  "curieux",
  "visiteur",
];

/**
 * Rôles autorisés à l'auto-inscription.
 * ✅ Actifs pour la v1 : patient, client, curieux, scientifique
 * ❌ Bloqués : superAdmin (seed), adminSOCAphy (invitation admin plus tard),
 *              clinic, praticienSante, tradiPraticien (modules désactivés)
 */
export const OPEN_REGISTER_ROLES = [
  "patient",
  "client",
  "curieux",
  "scientifique",
];

export const PENDING_REGISTER_ROLES = [];

export const SEEDED_ROLES = ["superAdmin", "adminSOCAphy"];

export const PUBLIC_REGISTER_ROLES = [
  ...OPEN_REGISTER_ROLES,
  ...PENDING_REGISTER_ROLES,
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  MODULES DÉSACTIVÉS                                                */
/*  Retirer un module d'ici pour le réactiver                         */
/* ═══════════════════════════════════════════════════════════════════ */

export const DISABLED_MODULES = {
  clinic: true,          // Cliniques
  market: true,          // Marché
  community: true,       // Communauté
  shop: true,            // Boutiques / produits
  praticienSante: true,  // Praticiens de santé
  tradiPraticien: true,  // Praticiens traditionnels
};

/** Routes bloquées par module désactivé (préfixes). */
export const DISABLED_ROUTES = [
  { prefix: "/users/clinic",                     module: "clinic" },
  { prefix: "/users/praticienSante",             module: "praticienSante" },
  { prefix: "/users/tradiPraticien",             module: "tradiPraticien" },
  { prefix: "/market",                           module: "market" },
  { prefix: "/users/communaute",                 module: "community" },
  { prefix: "/users/boutique",                   module: "shop" },
  { prefix: "/adminDashboard/manageClinics",     module: "clinic" },
  { prefix: "/adminDashboard/managePraticiens",  module: "praticienSante" },
  { prefix: "/adminDashboard/manageCommunity",   module: "community" },
  { prefix: "/adminDashboard/manageShops",       module: "shop" },
];

/** Renvoie true si l'URL est bloquée. */
export function isRouteDisabled(pathname) {
  for (const { prefix, module } of DISABLED_ROUTES) {
    if (!DISABLED_MODULES[module]) continue;
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return true;
    }
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  LABELS & ACCÈS                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

export const ROLE_LABELS = {
  superAdmin: "Super Administrateur",
  adminSOCAphy: "Membre SOCAphy",
  scientifique: "Scientifique",
  praticienSante: "Praticien de santé",
  clinic: "Clinique traditionnelle",
  tradiPraticien: "Praticien traditionnel",
  patient: "Patient",
  client: "Client",
  curieux: "Curieux",
  visiteur: "Visiteur",
};

export const ROLE_HOME = {
  superAdmin: "/adminDashboard",
  adminSOCAphy: "/users/adminSOCAphy",
  scientifique: "/users/scientifique",
  praticienSante: "/users/praticienSante",
  clinic: "/users/clinic",
  tradiPraticien: "/users/tradiPraticien",
  patient: "/users/patient",
  client: "/users/client",
  curieux: "/users/curieux",
  visiteur: "/",
};

export const ROLE_ALLOWED_PREFIXES = {
  superAdmin: ["/adminDashboard", "/users", "/publicSpace", "/cjp", "/association", "/concept"],
  adminSOCAphy: [
    "/users/adminSOCAphy",
    "/users/cjp",
    "/users/profile",
    "/users/cv",
    "/adminDashboard/manageArticles",
    "/adminDashboard/manageCv",
    "/publicSpace",
    "/cjp",
  ],
  scientifique: [
    "/users/scientifique",
    "/users/cjp",
    "/users/profile",
    "/users/cv",
    "/publicSpace",
    "/cjp",
  ],
  patient: ["/users/patient", "/users/profile", "/publicSpace"],
  client: ["/users/client", "/users/profile", "/publicSpace"],
  curieux: ["/users/curieux", "/users/profile", "/publicSpace"],
  // Modules désactivés — tableaux vides
  clinic: [],
  praticienSante: [],
  tradiPraticien: [],
  visiteur: ["/", "/auth", "/publicSpace", "/association", "/concept", "/cjp"],
};

export function homeFor(role) {
  return ROLE_HOME[role] ?? "/";
}

export function canAccess(role, pathname) {
  if (!role) return false;

  // Route désactivée → bloqué
  if (isRouteDisabled(pathname)) return false;

  // CJP routes : accès public en lecture, submit restreint
  if (pathname === "/cjp" || pathname.startsWith("/cjp/")) {
    if (pathname === "/cjp/submit" || pathname.startsWith("/cjp/submit/")) {
      return [
        "superAdmin",
        "adminSOCAphy",
        "scientifique",
      ].includes(role);
    }
    return true;
  }

  // Routes partagées — tout utilisateur connecté
  if (
    pathname === "/users/profile" ||
    pathname.startsWith("/users/profile/") ||
    pathname === "/users/cv" ||
    pathname.startsWith("/users/cv/") ||
    pathname === "/users/cjp" ||
    pathname.startsWith("/users/cjp/")
  ) {
    return role !== "visiteur";
  }

  // Accès par préfixe de rôle
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? [];
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isOpenRole(role) {
  return OPEN_REGISTER_ROLES.includes(role);
}

export function isPendingRole(role) {
  return PENDING_REGISTER_ROLES.includes(role);
}
