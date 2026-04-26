import { z } from "zod";
import { EmailSchema, IdSchema, PasswordSchema } from "./common.js";

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const RequestPasswordResetSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
});

export const InviteUserSchema = z.object({
  email: EmailSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  roleId: IdSchema.optional(),
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
