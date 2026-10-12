// src/lib/validators.js
import { z } from "zod";
import { PUBLIC_REGISTER_ROLES } from "./roles";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(72)
    .regex(/[A-Za-z]/, "Doit contenir une lettre")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  role: z.enum(PUBLIC_REGISTER_ROLES),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  expectedRole: z.string().optional(),
});