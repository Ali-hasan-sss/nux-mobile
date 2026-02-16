import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text } from "@/components/AppText";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, StatusBar } from "react-native";

export function AuthHeader() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Calculate safe top padding for header
  const topPadding = Platform.OS === "android" 
    ? Math.max(insets.top || 0, StatusBar.currentHeight || 0)
    : insets.top;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(26, 31, 58, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding,
            backgroundColor: "transparent",
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    width: 120,
    height: 60,
  },
});
