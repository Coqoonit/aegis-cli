import { z } from "zod";
import { IdSchema } from "./common.js";

export const DeadlineTypeSchema = z.enum([
  "RISK_REVIEW",
  "VERIFICATION_RENEWAL",
  "CASE_EXPIRY",
  "DOCUMENT_EXPIRY",
  "CUSTOM",
]);

export const DeadlineStatusSchema = z.enum([
  "UPCOMING",
  "OVERDUE",
  "COMPLETED",
  "DISMISSED",
]);

export const DeadlineSortBySchema = z.enum([
  "type",
  "caseClient",
  "dueDate",
  "status",
  "assignee",
]);

/** Custom deadlines attached to a case. System deadlines (RISK_REVIEW, etc) are auto-generated. */
export const CreateDeadlineSchema = z.object({
  type: z.literal("CUSTOM"),
  dueDate: z.coerce.date(),
  assignedTo: IdSchema.optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const UpdateDeadlineSchema = z.object({
  status: DeadlineStatusSchema.optional(),
  assignedTo: IdSchema.nullable().optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const ListDeadlinesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: DeadlineStatusSchema.optional(),
  type: DeadlineTypeSchema.optional(),
  assignedTo: IdSchema.optional(),
  amlCaseId: IdSchema.optional(),
  dueBefore: z.coerce.date().optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sortBy: DeadlineSortBySchema.optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  includeClosed: z.coerce.boolean().optional(),
});
