import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import envPaths from "env-paths";

export interface StoredUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
}

export interface StoredConfig {
  accessToken?: string;
  refreshToken?: string;
  user?: StoredUser;
  apiUrl?: string;
}

const DEFAULT_API_URL = "http://localhost:3000";

export function getConfigPath(): string {
  if (process.env.AEGIS_CONFIG_PATH) return process.env.AEGIS_CONFIG_PATH;
  const paths = envPaths("aegis", { suffix: "" });
  return join(paths.config, "config.json");
}

export function loadConfig(): StoredConfig {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as StoredConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: StoredConfig): void {
  const path = getConfigPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2), "utf-8");
  try {
    chmodSync(path, 0o600);
  } catch {
    // ignore on windows (no POSIX perms)
  }
}

export function clearConfig(): void {
  saveConfig({});
}

export function getApiUrl(): string {
  return process.env.AEGIS_API_URL || loadConfig().apiUrl || DEFAULT_API_URL;
}
