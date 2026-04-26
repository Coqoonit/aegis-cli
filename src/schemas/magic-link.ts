import { z } from "zod";
import { CaseFormTypeSchema } from "./case-form.js";
import { IdSchema } from "./common.js";

export const CreateMagicLinkSchema = z.object({
  amlCaseId: IdSchema,
  formType: CaseFormTypeSchema,
  uboId: IdSchema.optional(),
  targetEmail: z.string().email().max(320).trim().optional(),
  targetName: z.string().max(200).trim().optional(),
  expiryHours: z.number().int().min(1).max(720).optional(),
});

export type CreateMagicLinkDto = z.infer<typeof CreateMagicLinkSchema>;
