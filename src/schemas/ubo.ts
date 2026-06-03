import { z } from "zod";

export const UBOControlTypeSchema = z.enum([
  "DIRECT",
  "INDIRECT",
  "INDIRECT_INCOMPLETE",
  "CONTROL_OF_FACT",
  "LEGAL_REPRESENTATIVE",
]);

export const CreateUBOSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  fiscalCode: z.string().max(20).trim().optional(),
  birthDate: z.coerce.date().optional(),
  birthPlace: z.string().max(200).trim().optional(),
  nationality: z.string().max(100).trim().optional(),
  ownershipPercentage: z.number().min(0).max(100).optional(),
  directShare: z.number().min(0).max(100).optional(),
  indirectShare: z.number().min(0).max(100).optional(),
  controlType: UBOControlTypeSchema,
  participationChain: z.any().optional(),
  sourceEntityName: z.string().max(300).trim().optional(),
  sourceEntityFiscalCode: z.string().max(20).trim().optional(),
  depth: z.number().int().min(0).default(0),
  isPep: z.boolean().default(false),
  pepDetails: z.string().max(2000).trim().optional(),
  highRiskCountry: z.boolean().default(false),
  notes: z.string().max(5000).trim().optional(),
  // Marks this UBO as the Legal Representative (signer of AV.4 art. 22).
  // Backend requires at least one LR per case for the dossier to be complete.
  isLegalRepresentative: z.boolean().default(false),
});

export const ResolveUBOSchema = z.object({
  vatNumber: z.string().min(11).max(16).trim().optional(),
});

export const ListUBOsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateUBODto = z.infer<typeof CreateUBOSchema>;
export type ResolveUBODto = z.infer<typeof ResolveUBOSchema>;
export type ListUBOsQuery = z.infer<typeof ListUBOsQuerySchema>;
