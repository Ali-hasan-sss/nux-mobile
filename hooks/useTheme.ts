import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Appearance } from "react-native";
import { Colors } from "@/constants/Colors";
import { RootState, AppDispatch } from "@/store/store";
import {
  updateSystemTheme,
  initializeTheme,
  loadThemePreference,
} from "@/store/slices/themeSlice";

const FONT_ARABIC = "Cairo_400Regular";
const FONT_DEFAULT = "Poppins_400Regular";

export const useTheme = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { mode, isDark } = useSelector((state: RootState) => state.theme);
  const currentLanguage = useSelector(
    (state: RootState) => state.language.currentLanguage
  );
  const defaultFontFamily =
    currentLanguage === "ar" ? FONT_ARABIC : FONT_DEFAULT;

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference().then((savedMode) => {
      dispatch(initializeTheme(savedMode));
    });
  }, [dispatch]);

  // Listen to system theme changes when mode is "system"
  useEffect(() => {
    if (mode === "system") {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        dispatch(updateSystemTheme());
      });

      return () => {
        subscription.remove();
      };
    }
  }, [mode, dispatch]);

  // Determine which color scheme to use
  const colorScheme = isDark ? Colors.dark : Colors.light;

  return {
    colors: colorScheme,
    isDark,
    mode,
    defaultFontFamily,
  };
};
