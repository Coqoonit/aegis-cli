import { confirm, input, password as promptPassword } from "@inquirer/prompts";
import { ValidationError } from "./errors.js";

export async function promptIfMissing(
  value: string | undefined,
  opts: { name: string; message: string; secret?: boolean },
): Promise<string> {
  if (value !== undefined && value !== "") return value;
  if (!process.stdin.isTTY) {
    throw new ValidationError(
      `--${opts.name} is required in non-interactive mode`,
    );
  }
  if (opts.secret) {
    return promptPassword({ message: opts.message, mask: "*" });
  }
  return input({ message: opts.message });
}

export async function confirmDestructive(opts: {
  message: string;
  yes?: boolean;
}): Promise<void> {
  if (opts.yes) return;
  if (!process.stdin.isTTY) {
    throw new ValidationError(
      "--yes is required for destructive actions in non-interactive mode",
    );
  }
  const ok = await confirm({ message: opts.message, default: false });
  if (!ok) {
    throw new ValidationError("Aborted by user");
  }
}
