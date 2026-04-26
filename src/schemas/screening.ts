import { z } from "zod";
import { IdSchema } from "./common.js";

export const ScreeningTypeSchema = z.enum(["SANCTIONS", "PEP", "ADVERSE_MEDIA"]);
export const ScreeningPersonTypeSchema = z.enum([
  "CLIENT",
  "LEGAL_REPRESENTATIVE",
  "UBO",
  "COMPANY",
]);
export const ScreeningStatusSchema = z.enum(["PENDING", "COMPLETED", "ERROR"]);
export const ScreeningReviewStatusSchema = z.enum([
  "PENDING_REVIEW",
  "CONFIRMED_MATCH",
  "FALSE_POSITIVE",
  "ESCALATED",
]);

export const CreateScreeningSchema = z
  .object({
    type: ScreeningTypeSchema,
    personType: ScreeningPersonTypeSchema,
    searchTerm: z.string().min(1).max(500).trim(),
    firstName: z.string().max(200).trim().optional(),
    lastName: z.string().max(200).trim().optional(),
    uboId: IdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.personType === "UBO" && !data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId is required when personType is UBO",
        path: ["uboId"],
      });
    }
    if (data.personType !== "UBO" && data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId must not be set when personType is not UBO",
        path: ["uboId"],
      });
    }
  });

export const CreateFullScreeningSchema = z
  .object({
    personType: ScreeningPersonTypeSchema,
    searchTerm: z.string().min(1).max(500).trim(),
    firstName: z.string().max(200).trim().optional(),
    lastName: z.string().max(200).trim().optional(),
    uboId: IdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.personType === "UBO" && !data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId is required when personType is UBO",
        path: ["uboId"],
      });
    }
    if (data.personType !== "UBO" && data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId must not be set when personType is not UBO",
        path: ["uboId"],
      });
    }
  });

export const CreateManualScreeningSchema = z
  .object({
    type: ScreeningTypeSchema,
    personType: z.enum(["CLIENT", "UBO", "COMPANY"]),
    searchTerm: z.string().min(1).max(500).trim(),
    uboId: IdSchema.optional(),
    results: z
      .array(
        z.object({
          matchFound: z.literal(true).default(true),
          matchedList: z.string().max(500).trim().optional(),
          matchDetails: z.string().max(5000).trim().optional(),
        }),
      )
      .min(0)
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.personType === "UBO" && !data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId is required when personType is UBO",
        path: ["uboId"],
      });
    }
    if (data.personType !== "UBO" && data.uboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "uboId must not be provided when personType is not UBO",
        path: ["uboId"],
      });
    }
  });

export const ReviewScreeningResultSchema = z.object({
  reviewStatus: z.enum(["CONFIRMED_MATCH", "FALSE_POSITIVE", "ESCALATED"]),
  notes: z.string().max(5000).trim().optional(),
});
