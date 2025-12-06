import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}

// Dark gradient theme - always dark gradient, no light mode support
const initialState: ThemeState = {
  mode: "dark", // Always dark gradient
  isDark: true, // Always dark gradient background
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    setIsDark: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
    },
  },
});

export const { setTheme, setIsDark } = themeSlice.actions;
export default themeSlice;
