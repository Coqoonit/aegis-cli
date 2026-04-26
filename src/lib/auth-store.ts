import { loadConfig, saveConfig, type StoredUser } from "./config.js";

export function getAccessToken(): string | null {
  return loadConfig().accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return loadConfig().refreshToken ?? null;
}

export function getStoredUser(): StoredUser | null {
  return loadConfig().user ?? null;
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  user?: StoredUser,
): void {
  const cfg = loadConfig();
  saveConfig({ ...cfg, accessToken, refreshToken, user: user ?? cfg.user });
}

export function clearAuth(): void {
  const cfg = loadConfig();
  const { accessToken: _a, refreshToken: _r, user: _u, ...rest } = cfg;
  void _a;
  void _r;
  void _u;
  saveConfig(rest);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
