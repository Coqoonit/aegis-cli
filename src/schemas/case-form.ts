import { z } from "zod";
import { IdSchema } from "./common.js";

export const CaseFormTypeSchema = z.enum([
  "FASCICOLO_CHECKLIST",
  "ISTRUTTORIA",
  "DICHIARAZIONE_CLIENTE",
  "CONTROLLO_COSTANTE",
  "ASTENSIONE",
  "SEGNALAZIONE_CONTANTE",
  "DELEGA",
  "COMUNICAZIONE_MEF",
]);

export const CaseFormStatusSchema = z.enum(["DRAFT", "COMPLETED", "SIGNED"]);

export const CreateCaseFormSchema = z.object({
  type: CaseFormTypeSchema,
  data: z.record(z.unknown()).default({}),
  notes: z.string().max(5000).trim().optional(),
});

export const UpdateCaseFormSchema = z.object({
  data: z.record(z.unknown()).optional(),
  notes: z.string().max(5000).trim().optional(),
});

/** POST .../forms/{id}/sign — references an existing signed document ID */
export const SignCaseFormSchema = z.object({
  signedDocumentId: IdSchema,
});
