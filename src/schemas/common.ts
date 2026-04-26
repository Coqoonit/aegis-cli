import { z } from "zod";

export const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email");

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const IdSchema = z.string().cuid("Invalid ID format");
