import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

/**
 * App text component: uses Cairo for Arabic and Poppins for other languages.
 * Use this instead of RN Text for app-wide consistent fonts.
 */
export function AppText({
  style,
  ...props
}: TextProps) {
  const { defaultFontFamily } = useTheme();
  return (
    <RNText
      style={[styles.base, style, { fontFamily: defaultFontFamily, fontWeight: "400" }]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
});

/** Drop-in replacement for RN Text: use Cairo (Arabic) or Poppins (others). */
export const Text = AppText;
