import type { BodySchemaRegistry } from "./lib/manifest.js";
import {
  CreateAmlCaseSchema,
  UpdateAmlCaseSchema,
} from "./schemas/case.js";
import {
  CreateCaseFormSchema,
} from "./schemas/case-form.js";
import {
  CreateClientSchema,
  UpdateClientSchema,
} from "./schemas/client.js";
import {
  CreateDeadlineSchema,
  UpdateDeadlineSchema,
} from "./schemas/deadline.js";
import {
  CreateIdentificationSchema,
  UpdateIdentificationSchema,
} from "./schemas/identification.js";
import {
  UpdateIdentityDocumentSchema,
} from "./schemas/identity-document.js";
import { CreateMagicLinkSchema } from "./schemas/magic-link.js";
import {
  CreateRiskAssessmentSchema,
  SetRiskFactorLevelSchema,
  UpdateRiskAssessmentSchema,
} from "./schemas/risk-assessment.js";
import {
  CreateFullScreeningSchema,
  CreateManualScreeningSchema,
  CreateScreeningSchema,
  ReviewScreeningResultSchema,
} from "./schemas/screening.js";
import { CreateUBOSchema } from "./schemas/ubo.js";

/**
 * Maps command path (dot-notation) to the Zod schema used to validate its `--data` body.
 * Must be kept in sync with the actual command imports — only commands that
 * actually accept `--data <json>` belong here. Commands that build the body
 * from individual flags (e.g. `auth invite`, `auth request-password-reset`)
 * must NOT be listed: advertising a `data` input the CLI ignores creates a
 * silent mismatch between the manifest and runtime.
 */
export const BODY_SCHEMAS: BodySchemaRegistry = {
  // Clients
  "clients.create": CreateClientSchema,
  "clients.update": UpdateClientSchema,

  // Cases
  "cases.create": CreateAmlCaseSchema,
  "cases.update": UpdateAmlCaseSchema,

  // UBOs
  "ubos.create": CreateUBOSchema,

  // Identifications
  "ids.create": CreateIdentificationSchema,
  "ids.update": UpdateIdentificationSchema,

  // Identity documents (upload uses multipart — no JSON body)
  "id-docs.update": UpdateIdentityDocumentSchema,

  // Screenings
  "screenings.create": CreateScreeningSchema,
  "screenings.run-full": CreateFullScreeningSchema,
  "screenings.manual": CreateManualScreeningSchema,
  "screenings.review-result": ReviewScreeningResultSchema,

  // Risk
  "risk.create": CreateRiskAssessmentSchema,
  "risk.update": UpdateRiskAssessmentSchema,
  "risk.set-level": SetRiskFactorLevelSchema,

  // Forms
  "forms.create": CreateCaseFormSchema,

  // Magic links
  "magic.create": CreateMagicLinkSchema,

  // Deadlines
  "deadlines.create": CreateDeadlineSchema,
  "deadlines.update": UpdateDeadlineSchema,
};

/**
 * Subset of {@link BODY_SCHEMAS} where the CLI accepts `--data` as optional —
 * the runtime falls back to `{}` when the flag is missing. The manifest must
 * reflect this so an LLM client doesn't get a `required: ["data"]` constraint
 * that the real command doesn't enforce.
 *
 * Keep in sync with any command that calls `args.data ? readJsonData(...) : {}`.
 */
export const OPTIONAL_BODY_COMMANDS: ReadonlySet<string> = new Set([
  "risk.create",
]);
