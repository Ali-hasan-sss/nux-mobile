import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useAppTranslation() {
  const { t, i18n, ...rest } = useTranslation();

  const ta = useCallback(
    (key: string, fallback: string, options?: Record<string, unknown>) => {
      const value = t(key, { defaultValue: fallback, ...options });
      const text = String(value);
      if (!text || text === key) {
        return fallback;
      }
      return text;
    },
    [t]
  );

  return { t: ta, i18n, ...rest };
}
