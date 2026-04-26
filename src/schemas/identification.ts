import { z } from "zod";
import { IdSchema } from "./common.js";
import { RiskLevelSchema } from "./client.js";

export const IdentificationTypeSchema = z.enum([
  "CONDUCT_RULES",
  "SIMPLIFIED",
  "ORDINARY",
  "ENHANCED",
]);

export const CreateIdentificationSchema = z.object({
  type: IdentificationTypeSchema.default("ORDINARY"),
  firstName: z.string().max(150).trim().optional(),
  lastName: z.string().max(150).trim().optional(),
  companyName: z.string().max(300).trim().optional(),
  fiscalCode: z.string().max(20).trim().optional(),
  vatNumber: z.string().max(20).trim().optional(),
  identityDocumentId: IdSchema.optional(),
  assignedTo: IdSchema.optional(),
});

export const UpdateIdentificationSchema = z.object({
  type: IdentificationTypeSchema.optional(),
  firstName: z.string().max(150).trim().optional(),
  lastName: z.string().max(150).trim().optional(),
  companyName: z.string().max(300).trim().optional(),
  fiscalCode: z.string().max(20).trim().optional(),
  vatNumber: z.string().max(20).trim().optional(),

  // Legal entity
  legalForm: z.string().max(100).trim().optional(),
  registeredOffice: z.string().max(500).trim().optional(),
  businessRegistry: z.string().max(200).trim().optional(),
  reaNumber: z.string().max(50).trim().optional(),
  activity: z.string().max(500).trim().optional(),

  // Natural person
  birthDate: z.coerce.date().optional(),
  birthPlace: z.string().max(200).trim().optional(),
  residence: z.string().max(500).trim().optional(),
  documentData: z.any().optional(),

  // Operation
  operationType: z.string().max(200).trim().optional(),
  operationPurpose: z.string().max(1000).trim().optional(),
  requestedService: z.string().max(500).trim().optional(),
  paymentMethods: z.string().max(500).trim().optional(),
  fundOrigin: z.string().max(1000).trim().optional(),

  // Compliance
  riskLevel: RiskLevelSchema.optional(),
  riskMotivation: z.string().max(5000).trim().optional(),
  screeningStatus: z.string().max(50).optional(),
  adverseMediaStatus: z.string().max(50).optional(),

  // S3 paths
  visuraPath: z.string().optional(),
  identityDocFrontPath: z.string().optional(),
  identityDocBackPath: z.string().optional(),
  generatedFormPath: z.string().optional(),
  signedFormPath: z.string().optional(),

  identityDocumentId: IdSchema.optional(),
  assignedTo: IdSchema.optional(),
});

export const ListIdentificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateIdentificationDto = z.infer<typeof CreateIdentificationSchema>;
export type UpdateIdentificationDto = z.infer<typeof UpdateIdentificationSchema>;
