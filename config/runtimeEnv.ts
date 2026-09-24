/** Shared dev vs production URL helpers (Expo inlines EXPO_PUBLIC_* at bundle time). */

export const PRODUCTION_API_BASE = "https://back.nuxapp.de/api";
export const PRODUCTION_WEBSITE_BASE = "https://nuxapp.de";
export const DEV_API_PORT = 5000;
export const DEV_WEBSITE_PORT = 3000;

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** True when URL points at hosted production backend (not a LAN/dev host). */
export function isProductionBackendUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("api.nuxapp.de")) return true;
  if (lower.includes("back.nuxapp.de")) return true;
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return false;
  if (lower.includes("10.0.2.2")) return false;
  if (/192\.168\.\d+\.\d+/.test(lower) || /10\.\d+\.\d+\.\d+/.test(lower)) {
    return false;
  }
  return lower.includes("nuxapp.de") && lower.includes("/api");
}

export function isProductionWebsiteUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return false;
  if (lower.includes("10.0.2.2")) return false;
  if (/192\.168\.\d+\.\d+/.test(lower) || /10\.\d+\.\d+\.\d+/.test(lower)) {
    return false;
  }
  return lower.includes("nuxapp.de");
}

/**
 * If only EXPO_PUBLIC_WEBSITE_URL is set for a physical device (e.g. http://192.168.1.3:3000),
 * use the same host for API on port 5000.
 */
export function devApiBaseFromWebsiteEnv(): string | null {
  if (!__DEV__) return null;
  const website = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim();
  if (!website || isProductionWebsiteUrl(website)) return null;
  try {
    const u = new URL(website);
    if (!u.hostname) return null;
    return `http://${u.hostname}:${DEV_API_PORT}/api`;
  } catch {
    return null;
  }
}

/** Dev: derive website URL from API env (same LAN host, port 3000). */
export function devWebsiteBaseFromApiEnv(): string | null {
  if (!__DEV__) return null;
  const api = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!api || isProductionBackendUrl(api)) return null;
  try {
    const u = new URL(api);
    if (!u.hostname) return null;
    return `http://${u.hostname}:${DEV_WEBSITE_PORT}`;
  } catch {
    return null;
  }
}
