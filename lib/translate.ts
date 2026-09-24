import i18n from "@/i18n/i18n";

/**
 * Resolve a translation key with a guaranteed human-readable fallback
 * (avoids showing raw keys like `drawer.privacyPolicy` before i18n is ready).
 */
export function translate(
  key: string,
  fallback: string,
  options?: Record<string, unknown>
): string {
  if (!i18n.isInitialized) {
    return fallback;
  }
  const value = i18n.t(key, { defaultValue: fallback, ...options });
  const text = String(value);
  if (!text || text === key) {
    return fallback;
  }
  return text;
}
