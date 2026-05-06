import React, { useMemo, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import {
  rtlBufferToCents,
  rtlDigitsFromDeviceInput,
  formatRtlMoneyMask,
  localizeMoneyMaskVisual,
} from "@/lib/moneyInput";

export type RtlMoneyAmountFieldProps = {
  buffer: string;
  onBufferChange: (next: string) => void;
  maxCents: number;
  disabled?: boolean;
  currencyCode?: string;
  compact?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Shows amount always as X.XX (two decimals). Device keypad edits an invisible RTL
 * digit buffer (cents-first); digits shift left until they move past the decimal.
 */
export function RtlMoneyAmountField({
  buffer,
  onBufferChange,
  maxCents,
  disabled = false,
  currencyCode = "EUR",
  compact = false,
  containerStyle,
}: RtlMoneyAmountFieldProps) {
  const { i18n } = useTranslation();
  const { colors, defaultFontFamily, isDark } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };

  const maskDisplay = useMemo(
    () =>
      localizeMoneyMaskVisual(formatRtlMoneyMask(buffer), i18n.language),
    [buffer, i18n.language]
  );

  const onChangeText = useCallback(
    (text: string) => {
      onBufferChange(rtlDigitsFromDeviceInput(text, maxCents));
    },
    [maxCents, onBufferChange]
  );

  const padV = compact ? 10 : 12;
  const padH = compact ? 12 : 14;
  const fontSize = compact ? 17 : 19;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: colors.border,
          backgroundColor: isDark ? colors.background : colors.surface,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
        containerStyle,
      ]}
    >
      {/* Formatted amount underneath; invisible TextInput on top captures taps & keyboard. */}
      <View style={styles.overlayCenter} collapsable={false}>
        <Text style={[styles.overlayRow, font]}>
          <Text style={{ flexDirection: "row", writingDirection: "ltr" }}>
            {maskDisplay.split("").map((ch, i) => {
              const isDash = ch === "-";
              return (
                <Text
                  key={`m-${i}`}
                  style={{
                    color: isDash ? colors.textSecondary : colors.text,
                    fontSize,
                  }}
                >
                  {ch}
                </Text>
              );
            })}
          </Text>
          {currencyCode ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: compact ? 14 : 15,
              }}
            >
              {` ${currencyCode}`}
            </Text>
          ) : null}
        </Text>
      </View>
      <TextInput
        style={[
          StyleSheet.absoluteFillObject,
          styles.ghostInput,
          {
            fontSize,
            fontFamily: defaultFontFamily,
          },
        ]}
        value={buffer}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        editable={!disabled}
        autoCorrect={false}
        autoCapitalize="none"
        caretHidden
        underlineColorAndroid="transparent"
        importantForAutofill="no"
        textContentType="none"
        placeholder=""
        placeholderTextColor="transparent"
        selectionColor="transparent"
        {...(Platform.OS === "android"
          ? { textAlignVertical: "center" as const }
          : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    overflow: "hidden",
  },
  ghostInput: {
    // Fully hide native buffer text (transparent alone still paints on some Android builds).
    color: "rgba(0,0,0,0)",
    opacity: 0,
    textAlign: "center",
    padding: 0,
    margin: 0,
    zIndex: 1,
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "baseline",
    writingDirection: "ltr",
  },
});
