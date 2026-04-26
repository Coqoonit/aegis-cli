/**
 * Curated hints for specific commands — workflow edges (what comes next),
 * prerequisites (what must exist), credit consumption, and overrides for
 * safety/idempotent where auto-inference is wrong.
 *
 * Keys match command paths (dot-notation). Safety is auto-inferred when
 * omitted (read for list/get/stats/catalog/alerts/overdue/upcoming/dashboard,
 * destructive for delete/delete-all/archive, write for everything else).
 */

export interface XAegisHints {
  /** "read" | "write" | "destructive" — impacts what LLMs should confirm with user */
  safety?: "read" | "write" | "destructive";
  /** Whether the operation is safe to retry (true for most GET/PUT/DELETE) */
  idempotent?: boolean;
  /** Natural-language preconditions */
  prerequisites?: string[];
  /** Tool names likely to follow this one in a workflow */
  typically_followed_by?: string[];
  /** Whether the operation consumes wallet credits */
  consumes_credits?: boolean;
}

export const TOOL_HINTS: Record<string, XAegisHints> = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  "auth.login": {
    typically_followed_by: ["aegis_clients_list", "aegis_deadlines_dashboard"],
  },
  "auth.invite": {
    prerequisites: ["Caller must have TENANT_ADMIN role"],
  },

  // ─── Clients ─────────────────────────────────────────────────────────────
  "clients.create": {
    typically_followed_by: ["aegis_cases_create"],
  },
  "clients.set-pep": {
    prerequisites: ["Client must exist (aegis_clients_get)"],
    typically_followed_by: ["aegis_risk_create"],
  },

  // ─── Cases ───────────────────────────────────────────────────────────────
  "cases.create": {
    prerequisites: ["Client must exist (aegis_clients_get or aegis_clients_create)"],
    typically_followed_by: [
      "aegis_ubos_resolve (if COMPANY client)",
      "aegis_id_docs_upload",
      "aegis_screenings_run_full",
    ],
  },
  "cases.approve": {
    prerequisites: [
      "All required case steps complete: screenings reviewed, risk assessment APPROVED, forms SIGNED",
    ],
    typically_followed_by: ["aegis_case_docs_dossier"],
  },
  "cases.set-risk-flags": {
    typically_followed_by: ["aegis_risk_create"],
  },
  "cases.delete": {
    safety: "destructive",
    idempotent: false,
  },

  // ─── UBOs ────────────────────────────────────────────────────────────────
  "ubos.resolve": {
    prerequisites: [
      "Case must exist",
      "Client must be COMPANY type with valid VAT number (or pass --vat-number)",
    ],
    typically_followed_by: ["aegis_screenings_run_full"],
    consumes_credits: true,
  },
  "ubos.create": {
    prerequisites: ["Case must exist"],
  },

  // ─── Identifications ─────────────────────────────────────────────────────
  "ids.create": {
    prerequisites: ["Case must exist; identity document recommended (aegis_id_docs_upload)"],
    typically_followed_by: ["aegis_ids_complete"],
  },
  "ids.complete": {
    prerequisites: ["Identification must be PENDING or IN_PROGRESS"],
  },

  // ─── Identity Documents ──────────────────────────────────────────────────
  "id-docs.upload": {
    prerequisites: [
      "Case must exist",
      "Accepted: PDF, JPEG, PNG, WEBP, TIFF, DOC, DOCX, XLS, XLSX, TXT (max 20MB)",
    ],
    typically_followed_by: ["aegis_ids_create"],
  },

  // ─── Screenings ──────────────────────────────────────────────────────────
  "screenings.create": {
    consumes_credits: true,
    typically_followed_by: ["aegis_screenings_review_result"],
  },
  "screenings.run-full": {
    consumes_credits: true,
    typically_followed_by: ["aegis_screenings_review_result", "aegis_risk_create"],
  },
  "screenings.manual": {
    consumes_credits: false,
  },
  "screenings.review-result": {
    prerequisites: ["Screening result must be in PENDING_REVIEW state"],
  },
  "screenings.delete-all": {
    safety: "destructive",
    idempotent: true,
  },

  // ─── Risk Assessment ─────────────────────────────────────────────────────
  "risk.create": {
    prerequisites: [
      "Case flags may need to be set first (aegis_cases_set_risk_flags)",
    ],
    typically_followed_by: ["aegis_risk_set_level", "aegis_risk_approve"],
  },
  "risk.set-level": {
    prerequisites: [
      "Risk assessment must exist",
      "Fetch valid categoryCodes and definitionIds with aegis_risk_catalog",
    ],
    idempotent: true,
  },
  "risk.approve": {
    prerequisites: [
      "All risk factor levels set",
      "Risk assessment in COMPLETED state",
    ],
  },
  "risk.catalog": {
    idempotent: true,
  },

  // ─── Forms ───────────────────────────────────────────────────────────────
  "forms.create": {
    typically_followed_by: ["aegis_forms_complete"],
  },
  "forms.complete": {
    prerequisites: ["Form must be in DRAFT"],
    typically_followed_by: ["aegis_forms_pdf"],
  },
  "forms.pdf": {
    prerequisites: ["Form should be COMPLETED or SIGNED"],
    typically_followed_by: ["aegis_case_docs_upload"],
  },
  "forms.sign": {
    prerequisites: [
      "Form must be COMPLETED",
      "Signed PDF must be uploaded first (aegis_case_docs_upload) to get signed-document-id",
    ],
  },

  // ─── Case Documents ──────────────────────────────────────────────────────
  "case-docs.upload": {
    prerequisites: [
      "Case must exist",
      "Accepted: PDF, JPEG, PNG, WEBP, TIFF, DOC, DOCX, XLS, XLSX, TXT (max 20MB)",
    ],
  },
  "case-docs.dossier": {
    prerequisites: [
      "Typically run at end of case, after all forms are SIGNED and risk is APPROVED",
    ],
    typically_followed_by: ["aegis_cases_approve"],
  },

  // ─── Magic Links ─────────────────────────────────────────────────────────
  "magic.create": {
    typically_followed_by: ["Share the returned URL with the external user by email"],
  },

  // ─── Deadlines ───────────────────────────────────────────────────────────
  "deadlines.dashboard": {
    typically_followed_by: ["aegis_deadlines_update (mark COMPLETED/DISMISSED)"],
  },
};

const READ_PATTERNS = [
  "list",
  "get",
  "stats",
  "catalog",
  "alerts",
  "overdue",
  "upcoming",
  "dashboard",
  "get-url",
  "verify-reset-token",
];

const DESTRUCTIVE_PATTERNS = ["delete", "delete-all", "archive"];

/** Infer a best-effort safety level from the command leaf name. */
export function inferSafety(path: string[]): "read" | "write" | "destructive" {
  const leaf = path[path.length - 1];
  if (!leaf) return "write";
  if (DESTRUCTIVE_PATTERNS.includes(leaf)) return "destructive";
  if (READ_PATTERNS.includes(leaf)) return "read";
  return "write";
}
