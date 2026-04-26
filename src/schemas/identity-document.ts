import { z } from "zod";

export const IdentityDocumentTypeSchema = z.enum([
  "CARTA_IDENTITA",
  "PATENTE",
  "PASSAPORTO",
  "PERMESSO_SOGGIORNO",
  "DOCUMENTO_ESTERO",
]);

export const IdentityAlertStatusSchema = z.enum([
  "VALID",
  "EXPIRING_30",
  "EXPIRING_15",
  "EXPIRING_7",
  "EXPIRED",
]);

/** Fields accepted via FormData on POST identity-documents (aside from `file` and `fileBack`). */
export const UploadIdentityDocumentMetaSchema = z.object({
  type: IdentityDocumentTypeSchema,
  documentNumber: z.string().max(50).trim().optional(),
  issuedBy: z.string().max(200).trim().optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isPrimary: z.boolean().optional(),
});

export const UpdateIdentityDocumentSchema = z.object({
  type: IdentityDocumentTypeSchema.optional(),
  documentNumber: z.string().max(50).trim().optional(),
  issuedBy: z.string().max(200).trim().optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isPrimary: z.boolean().optional(),
});

export const ListIdentityDocumentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const ListIdentityDocumentAlertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const GetIdentityDocumentUrlQuerySchema = z.object({
  side: z.enum(["front", "back"]).default("front"),
});

export type UploadIdentityDocumentMeta = z.infer<typeof UploadIdentityDocumentMetaSchema>;
