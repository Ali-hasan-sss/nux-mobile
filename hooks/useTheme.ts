import { Colors } from "@/constants/Colors";

// Dark gradient theme - always returns dark gradient colors (no light mode)
export const useTheme = () => {
  return {
    colors: Colors.light, // Use light key but with dark gradient colors
    isDark: true, // Always dark gradient background
    mode: "dark" as const,
  };
};
