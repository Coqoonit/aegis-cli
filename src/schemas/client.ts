import { z } from "zod";
import { IdSchema } from "./common.js";

export const ClientTypeSchema = z.enum(["INDIVIDUAL", "COMPANY"]);
export const ClientStatusSchema = z.enum(["ACTIVE", "ARCHIVED", "SUSPENDED"]);
export const RiskLevelSchema = z.enum([
  "NON_SIGNIFICATIVO",
  "POCO_SIGNIFICATIVO",
  "ABBASTANZA_SIGNIFICATIVO",
  "MOLTO_SIGNIFICATIVO",
]);

export const ClientSortBySchema = z.enum([
  "name",
  "taxCode",
  "type",
  "risk",
  "nextReview",
  "status",
]);

export const CreateClientSchema = z.object({
  type: ClientTypeSchema,

  // Natural person
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  fiscalCode: z.string().min(1).max(20).trim().optional(),
  birthDate: z.coerce.date().optional(),
  birthPlace: z.string().max(200).trim().optional(),
  gender: z.string().max(1).optional(),

  // Legal entity
  companyName: z.string().min(1).max(300).trim().optional(),
  vatNumber: z.string().max(20).trim().optional(),
  legalForm: z.string().max(100).trim().optional(),

  // Common
  address: z.string().max(500).trim().optional(),
  city: z.string().max(100).trim().optional(),
  province: z.string().max(5).trim().optional(),
  zipCode: z.string().max(10).trim().optional(),
  country: z.string().max(5).default("IT"),
  phone: z.string().max(30).trim().optional(),
  email: z.string().email().max(320).toLowerCase().trim().optional(),
  pec: z.string().email().max(320).toLowerCase().trim().optional(),

  // Business
  economicActivity: z.string().max(300).trim().optional(),
  atecoCode: z.string().max(20).trim().optional(),
  crmId: z.string().max(100).trim().optional(),
  studioResponsible: z.string().max(200).trim().optional(),

  onboardingDate: z.coerce.date().optional(),
  groupId: IdSchema.optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial()
  .omit({ type: true })
  .extend({
    status: ClientStatusSchema.optional(),
    riskLevel: RiskLevelSchema.optional(),
  });

export const SetPepFlagsSchema = z.object({
  isPep: z.boolean(),
  isPepActingAsPA: z.boolean().optional(),
});

export const ListClientsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(256).optional(),
  type: ClientTypeSchema.optional(),
  status: ClientStatusSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
  groupId: IdSchema.optional(),
  sortBy: ClientSortBySchema.optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type CreateClientDto = z.infer<typeof CreateClientSchema>;
export type UpdateClientDto = z.infer<typeof UpdateClientSchema>;
export type SetPepFlagsDto = z.infer<typeof SetPepFlagsSchema>;
export type ListClientsQuery = z.infer<typeof ListClientsQuerySchema>;
