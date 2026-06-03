import { z } from "zod";
import { EmailSchema, IdSchema } from "./common.js";

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const InviteUserSchema = z.object({
  email: EmailSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  roleId: IdSchema.optional(),
});

// ─── Passwordless: login link (magic link via email) ─────────────────────────

export const RequestLoginLinkSchema = z.object({
  email: EmailSchema,
});

export const ConsumeLoginLinkSchema = z.object({
  token: z.string().min(32).max(128),
});

export const LoginLinkVerifyResponseSchema = z.object({
  valid: z.boolean(),
  reason: z.enum(["invalid", "expired", "used"]).nullable(),
});

// ─── Consent gate (accept Privacy Policy / ToS) ──────────────────────────────

export const AcceptTermsSchema = z.object({
  privacyAccepted: z.literal(true),
  marketingConsent: z.boolean().optional(),
});

// ─── Personal Access Token (PAT) ─────────────────────────────────────────────

export const RegeneratePatSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
});

export const ExchangePatSchema = z.object({
  token: z.string().min(64).max(160),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const AuthUserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  tenantId: z.string(),
  roles: z.array(z.string()),
});

export const LoginResponseSchema = z.object({
  tokens: AuthTokensSchema,
  user: AuthUserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
