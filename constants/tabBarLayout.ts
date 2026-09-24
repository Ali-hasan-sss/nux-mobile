import { Platform } from "react-native";

/** Matches `(tabs)/_layout.tsx` tab bar height (absolute bar at screen bottom). */
export function getTabBarHeight(insetsBottom: number): number {
  const base = Platform.OS === "ios" ? 80 : 70;
  return base + Math.max(insetsBottom, 0);
}

/** Offset for floating buttons above the tab bar. */
export function getFloatingActionBottom(
  insetsBottom: number,
  gap = 12
): number {
  return getTabBarHeight(insetsBottom) + gap;
}
