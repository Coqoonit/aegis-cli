import { z } from "zod";

export const CaseDocumentCategorySchema = z.enum([
  "IDENTIFICATION_FORM",
  "SIGNED_FORM",
  "SCREENING_REPORT",
  "RISK_REPORT",
  "DOSSIER",
  "OTHER",
]);

/** Fields accepted via FormData on POST .../documents (aside from `file`). */
export const UploadCaseDocumentMetaSchema = z.object({
  category: CaseDocumentCategorySchema.default("OTHER"),
  notes: z.string().max(1000).trim().optional(),
});

export const ListCaseDocumentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
