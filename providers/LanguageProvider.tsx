import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { initializeLanguage } from "@/store/slices/languageSlice";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  useEffect(() => {
    const initializeLanguageFromStorage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        const lang = savedLanguage || "en";
        dispatch(initializeLanguage(lang));
        await i18n.changeLanguage(lang);

        // Force LTR for all languages
        if (I18nManager.isRTL) {
          I18nManager.allowRTL(false);
          I18nManager.forceRTL(false);
          // Note: requires app restart to fully apply on native
        }
      } catch (error) {
        dispatch(initializeLanguage("en"));
      }
    };

    initializeLanguageFromStorage();
  }, [dispatch, i18n]);

  return <>{children}</>;
};

