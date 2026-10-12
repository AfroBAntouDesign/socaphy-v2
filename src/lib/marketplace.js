// src/lib/marketplace.js

/** Roles allowed to open a shop. */
export const SHOP_OWNER_ROLES = [
  "clinic",
  "scientifique",
  "adminSOCAphy",
  "praticienSante",
  "tradiPraticien",
];

/**
 * Roles that must have at least one VALIDATED article
 * before they can open a shop.
 */
export const REQUIRES_VALIDATED_ARTICLE = ["scientifique", "adminSOCAphy"];

/** Product categories. */
export const PRODUCT_CATEGORIES = [
  { value: "plants", label: "Plantes médicinales" },
  { value: "powder", label: "Poudres & extraits" },
  { value: "oil", label: "Huiles & baumes" },
  { value: "capsule", label: "Gélules & comprimés" },
  { value: "infusion", label: "Infusions & tisanes" },
  { value: "cream", label: "Crèmes & onguents" },
  { value: "syrup", label: "Sirops" },
  { value: "other", label: "Autres" },
];

export const PRODUCT_CATEGORY_LABELS = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.value, c.label])
);

export const SHOP_STATUS_META = {
  pending: {
    label: "En attente",
    pill: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  active: {
    label: "Active",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Refusée",
    pill: "bg-red-50 text-red-700 ring-red-200",
  },
  suspended: {
    label: "Suspendue",
    pill: "bg-gray-100 text-gray-700 ring-gray-300",
  },
  archived: {
    label: "Archivée",
    pill: "bg-gray-100 text-gray-600 ring-gray-200",
  },
};

export const PRODUCT_STATUS_META = {
  pending: {
    label: "En attente",
    pill: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  active: {
    label: "En vente",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: {
    label: "Refusé",
    pill: "bg-red-50 text-red-700 ring-red-200",
  },
  out_of_stock: {
    label: "Rupture",
    pill: "bg-gray-100 text-gray-700 ring-gray-300",
  },
  archived: {
    label: "Archivé",
    pill: "bg-gray-100 text-gray-600 ring-gray-200",
  },
};

export function slugify(str) {
  return (
    String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "item"
  );
}