import { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { useTheme } from "@/hooks/useTheme";

/** Sync Android navigation bar + root background with app theme. */
export function SystemChrome() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const bg = colors.background;
    void NavigationBar.setBackgroundColorAsync(bg);
    void NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    void NavigationBar.setVisibilityAsync("visible");
    void SystemUI.setBackgroundColorAsync(bg);
  }, [colors.background, isDark]);

  return null;
}
