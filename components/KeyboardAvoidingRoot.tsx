import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra offset (e.g. tab header height on account screen). */
  extraOffset?: number;
};

/** KeyboardAvoidingView for iOS and Android (works with adjustResize + padding). */
export function KeyboardAvoidingRoot({
  children,
  style,
  extraOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.root, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={
        (Platform.OS === "ios" ? insets.top : 0) + extraOffset
      }
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
