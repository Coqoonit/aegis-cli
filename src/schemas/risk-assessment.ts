import { z } from "zod";

export const RiskAssessmentStatusSchema = z.enum([
  "DRAFT",
  "COMPLETED",
  "APPROVED",
]);

export const CreateRiskAssessmentSchema = z.object({
  operationDescription: z.string().max(5000).trim().optional(),
  relationshipType: z.enum(["CONTINUOUS", "OCCASIONAL"]).optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const UpdateRiskAssessmentSchema = z
  .object({
    operationDescription: z.string().max(5000).trim().optional(),
    relationshipType: z.enum(["CONTINUOUS", "OCCASIONAL"]).optional(),
    notes: z.string().max(5000).trim().optional(),
  })
  .partial();

/**
 * SetRiskFactorLevelSchema — supports two modes:
 *   - Legacy (SINGLE_LEVEL / sections A-B): `selectedLevel` 1-4
 *   - New (SINGLE_VALUE / RI multi-bullet): `selectedDefinitionIds` array
 * At least one of the two is required.
 */
export const SetRiskFactorLevelSchema = z
  .object({
    categoryCode: z.string().min(1).max(64),
    selectedLevel: z.number().int().min(1).max(4).optional(),
    selectedDefinitionIds: z.array(z.string().min(1).max(64)).min(1).max(100).optional(),
    note: z.string().max(2000).trim().optional(),
  })
  .refine(
    (v) =>
      v.selectedLevel !== undefined ||
      (v.selectedDefinitionIds && v.selectedDefinitionIds.length > 0),
    { message: "either selectedLevel or selectedDefinitionIds must be specified" },
  );

export const RiskCatalogQuerySchema = z.object({
  versionId: z.string().optional(),
});
