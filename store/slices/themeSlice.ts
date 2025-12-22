import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

// Helper function to get system color scheme
const getSystemIsDark = (): boolean => {
  const systemColorScheme = Appearance.getColorScheme();
  return systemColorScheme === "dark";
};

// Initialize with default (will be updated when preference is loaded)
const initialState: ThemeState = {
  mode: "dark", // Default to dark
  isDark: true, // Default to dark
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;

      // Calculate isDark based on mode
      if (action.payload === "system") {
        state.isDark = getSystemIsDark();
      } else {
        state.isDark = action.payload === "dark";
      }

      // Save to AsyncStorage
      AsyncStorage.setItem("theme-mode", action.payload).catch((error) => {
        console.warn("Failed to save theme preference:", error);
      });
    },
    setIsDark: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
    },
    updateSystemTheme: (state) => {
      // Update isDark if mode is system
      if (state.mode === "system") {
        state.isDark = getSystemIsDark();
      }
    },
    initializeTheme: (state, action: PayloadAction<ThemeMode>) => {
      // Initialize theme from saved preference
      state.mode = action.payload;
      if (action.payload === "system") {
        state.isDark = getSystemIsDark();
      } else {
        state.isDark = action.payload === "dark";
      }
    },
  },
});

export const { setTheme, setIsDark, updateSystemTheme, initializeTheme } =
  themeSlice.actions;

// Load theme preference on app start
export const loadThemePreference = async (): Promise<ThemeMode> => {
  try {
    const saved = await AsyncStorage.getItem("theme-mode");
    if (
      saved &&
      (saved === "light" || saved === "dark" || saved === "system")
    ) {
      return saved as ThemeMode;
    }
  } catch (error) {
    console.warn("Failed to load theme preference:", error);
  }
  return "dark"; // Default to dark
};

export default themeSlice;
