import { z } from "zod";
import { IdSchema } from "./common.js";
import { RiskLevelSchema } from "./client.js";

export const TipoIncaricoSchema = z.enum([
  // Rischio 1
  "COLLEGIO_SINDACALE",
  "REVISIONE_LEGALE",
  "CERTIFICAZIONE_TRIBUTARIA",
  // Rischio 2
  "ASSISTENZA_TRIBUTARIA",
  "DICHIARAZIONI_FISCALI",
  "CONTABILITA_ORDINARIA",
  "CONTABILITA_SEMPLIFICATA",
  "CONSULENZA_LAVORO",
  "ELABORAZIONE_PAGHE",
  "CONSULENZA_PREVIDENZIALE",
  "PERIZIA_STIMA",
  "CONSULENZA_TECNICA_GIUDICE",
  "AMMINISTRATORE_GIUDIZIARIO",
  "CURATORE_FALLIMENTARE",
  "COMMISSARIO_GIUDIZIALE",
  "LIQUIDATORE_GIUDIZIALE",
  "CONSULENZA_TECNICA_PARTE",
  // Rischio 3
  "CONSULENZA_SOCIETARIA_CONTINUATIVA",
  "CONSULENZA_CONTRATTUALE",
  "ASSISTENZA_COMPRAVENDITA_IMMOBILIARE",
  "ASSISTENZA_COMPRAVENDITA_AZIENDA",
  "GESTIONE_INCASSI_PAGAMENTI",
  "CONSULENZA_PIANIFICAZIONE_FISCALE",
  "CONTENZIOSO_TRIBUTARIO",
  "ASSISTENZA_BANDI_PUBBLICI",
  // Rischio 4
  "FINANZA_STRAORDINARIA",
  "OPERAZIONI_SOCIETARIE_STRAORDINARIE",
  "ASSISTENZA_TRUST",
  "CONSULENZA_INVESTIMENTI_ESTERI",
  "COSTITUZIONE_GESTIONE_VEICOLI_SOCIETARI",
  "TRASFERIMENTO_SEDE_ESTERO",
]);

export const AmlCaseStatusSchema = z.enum([
  "DRAFT",
  "COMPLETED",
  "APPROVED",
  "EXPIRED",
  "ARCHIVED",
]);

export const AmlCaseSortBySchema = z.enum([
  "client",
  "engagement",
  "status",
  "risk",
  "nextReview",
  "lastUpdated",
]);

export const CreateAmlCaseSchema = z.object({
  clientId: IdSchema,
  engagementType: TipoIncaricoSchema,
  assignedTo: IdSchema.optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const UpdateAmlCaseSchema = z.object({
  status: AmlCaseStatusSchema.optional(),
  engagementType: TipoIncaricoSchema.optional(),
  assignedTo: IdSchema.optional(),
  riskMotivation: z.string().max(5000).trim().optional(),
  missingDocuments: z.any().optional(),
  participationChain: z.any().optional(),
  notes: z.string().max(5000).trim().optional(),
});

export const SetCaseRiskFlagsSchema = z
  .object({
    skipSectionB: z.boolean().optional(),
    involvesHighRiskThirdCountry: z.boolean().optional(),
    isTab1RT2Service: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "at least one flag must be specified",
  });

export const ListAmlCasesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  clientId: IdSchema.optional(),
  status: AmlCaseStatusSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
  search: z.string().max(256).optional(),
  sortBy: AmlCaseSortBySchema.optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type CreateAmlCaseDto = z.infer<typeof CreateAmlCaseSchema>;
export type UpdateAmlCaseDto = z.infer<typeof UpdateAmlCaseSchema>;
export type SetCaseRiskFlagsDto = z.infer<typeof SetCaseRiskFlagsSchema>;
export type ListAmlCasesQuery = z.infer<typeof ListAmlCasesQuerySchema>;
