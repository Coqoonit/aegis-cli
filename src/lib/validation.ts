import { IdSchema } from "../schemas/common.js";
import { ValidationError } from "./errors.js";

/** Require a CUID-formatted ID. Throws ValidationError if missing or invalid. */
export function requireCuid(
  value: string | undefined,
  name: string,
): string {
  if (!value) throw new ValidationError(`Missing ${name}`);
  const parsed = IdSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(`Invalid ${name}: must be a CUID`);
  }
  return value;
}

/** Validate an optional CUID. Returns undefined if not provided. */
export function optionalCuid(
  value: string | undefined,
  name: string,
): string | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = IdSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(`Invalid ${name}: must be a CUID`);
  }
  return value;
}
