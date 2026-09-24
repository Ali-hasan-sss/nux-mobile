import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/AppText";
import { Megaphone } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";

interface MenuBannerProps {
  message: string;
}

export function MenuBanner({ message }: MenuBannerProps) {
  const { colors, isDark } = useTheme();
  const text = message.trim();
  if (!text) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: isDark ? colors.primary + "40" : colors.primary + "33",
          backgroundColor: isDark
            ? colors.primary + "14"
            : colors.primary + "0D",
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: colors.primary + "22" },
        ]}
      >
        <Megaphone size={20} color={colors.primary} />
      </View>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});
