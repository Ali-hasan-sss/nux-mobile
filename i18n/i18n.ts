import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import de from "./locales/de.json";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const language = await AsyncStorage.getItem("user-language");
      if (language) {
        callback(language);
      } else {
        callback("en");
      }
    } catch (error) {
      console.error("Error reading language", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem("user-language", language);
    } catch (error) {
      console.error("Error saving language", error);
    }
  },
};

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  de: { translation: de },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    compatibilityJSON: "v4",
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
