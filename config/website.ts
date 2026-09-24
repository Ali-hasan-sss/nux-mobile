import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  PRODUCTION_WEBSITE_BASE,
  DEV_WEBSITE_PORT,
  normalizeBaseUrl,
  isProductionWebsiteUrl,
  devWebsiteBaseFromApiEnv,
} from "./runtimeEnv";

function metroBundlerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === "string" && hostUri.length > 0) {
    const host = hostUri.split(":")[0]?.trim();
    if (host) return host;
  }
  const dbg = (Constants.expoGoConfig as { debuggerHost?: string } | null)
    ?.debuggerHost;
  if (typeof dbg === "string" && dbg.length > 0) {
    return dbg.split(":")[0]?.trim() ?? null;
  }
  return null;
}

function defaultDevWebsiteBase(): string {
  const h = metroBundlerHost();
  if (h && h !== "localhost" && h !== "127.0.0.1") {
    return `http://${h}:${DEV_WEBSITE_PORT}`;
  }
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEV_WEBSITE_PORT}`;
  }
  return `http://127.0.0.1:${DEV_WEBSITE_PORT}`;
}

/** Public Next.js site (legal pages, menu links). */
export function getWebsiteBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim();

  if (__DEV__) {
    if (fromEnv && !isProductionWebsiteUrl(fromEnv)) {
      return normalizeBaseUrl(fromEnv);
    }
    const fromApi = devWebsiteBaseFromApiEnv();
    if (fromApi) return normalizeBaseUrl(fromApi);
    return normalizeBaseUrl(defaultDevWebsiteBase());
  }

  if (fromEnv && !isProductionWebsiteUrl(fromEnv)) {
    return normalizeBaseUrl(fromEnv);
  }
  return PRODUCTION_WEBSITE_BASE;
}

export type LegalPageType = "privacy" | "terms";
export type LegalLocale = "en" | "ar" | "de";

export function resolveLegalLocale(lang?: string): LegalLocale {
  const code = (lang || "en").split("-")[0].toLowerCase();
  if (code === "ar" || code === "de") return code;
  return "en";
}

export function getLegalPageUrl(type: LegalPageType, lang?: string): string {
  const locale = resolveLegalLocale(lang);
  return `${getWebsiteBaseUrl()}/legal/${type}?lang=${locale}&embed=1`;
}
