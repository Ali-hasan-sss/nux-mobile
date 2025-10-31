import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
        if (savedLanguage) {
          console.log("🌐 Initializing language:", savedLanguage);
          dispatch(initializeLanguage(savedLanguage));
          await i18n.changeLanguage(savedLanguage);
        } else {
          console.log("🌐 No saved language, using default: en");
          dispatch(initializeLanguage("en"));
        }
      } catch (error) {
        console.error("❌ Error initializing language:", error);
        dispatch(initializeLanguage("en"));
      }
    };

    initializeLanguageFromStorage();
  }, [dispatch, i18n]);

  return <>{children}</>;
};

