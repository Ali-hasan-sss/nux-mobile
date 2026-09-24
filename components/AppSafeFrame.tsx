import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Keeps app UI inside safe areas; background may extend full-bleed behind this. */
export function AppSafeFrame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.frame} edges={["left", "right"]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
