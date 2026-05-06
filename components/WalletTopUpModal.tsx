import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import {
  StripeProvider,
  useStripe,
  PaymentSheetError,
} from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/contexts/AlertContext";
import {
  createWalletTopUpPaymentIntent,
  syncWalletTopUpAfterPayment,
} from "@/api/walletPaymentApi";
import { rtlBufferToCents } from "@/lib/moneyInput";
import { RtlMoneyAmountField } from "@/components/RtlMoneyAmountField";
import { X } from "lucide-react-native";

/** Per top-up cap to reduce accidental large card charges (adjust if product needs higher). */
const MAX_TOP_UP_EUR = 10_000;
const MAX_TOP_UP_CENTS = MAX_TOP_UP_EUR * 100;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publishableKey: string;
};

function WalletTopUpModalBody({
  visible,
  onClose,
  onSuccess,
}: Omit<Props, "publishableKey">) {
  const { t } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const { showToast } = useAlert();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [rtlBuffer, setRtlBuffer] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRtlBuffer("");
      setBusy(false);
    }
  }, [visible]);

  const handlePay = async () => {
    const cents = rtlBufferToCents(rtlBuffer);
    const n = cents / 100;
    if (!Number.isFinite(n) || n < 1) {
      showToast({ message: t("wallet.minAmount"), type: "error" });
      return;
    }
    if (n > MAX_TOP_UP_EUR) {
      showToast({
        message: t("wallet.amountTooLarge", { max: MAX_TOP_UP_EUR }),
        type: "error",
      });
      return;
    }
    setBusy(true);
    try {
      const { clientSecret, paymentIntentId } =
        await createWalletTopUpPaymentIntent(n);
      if (!clientSecret) {
        showToast({ message: t("wallet.noClientSecret"), type: "error" });
        return;
      }
      const returnURL = Linking.createURL("stripe-redirect");
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "NUX",
        paymentIntentClientSecret: clientSecret,
        returnURL,
        style: isDark ? "alwaysDark" : "alwaysLight",
      });
      if (initError) {
        showToast({
          message: initError.message || t("wallet.topUpFailed"),
          type: "error",
        });
        return;
      }
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== PaymentSheetError.Canceled) {
          showToast({
            message: payError.message || t("wallet.topUpFailed"),
            type: "error",
          });
        }
        return;
      }
      try {
        const sync = await syncWalletTopUpAfterPayment(paymentIntentId);
        if (!sync.applied && !sync.duplicate) {
          showToast({
            message: t("wallet.topUpSyncPending"),
            type: "warning",
          });
        }
      } catch {
        showToast({
          message: t("wallet.topUpSyncPending"),
          type: "warning",
        });
      }
      showToast({ message: t("wallet.topUpSuccess"), type: "success" });
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : t("common.error");
      showToast({ message: msg, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const cardBg = isDark ? colors.surface : colors.background;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.flex}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={onClose}
          />
          <View
            style={styles.sheetWrap}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.sheet,
                { backgroundColor: cardBg, borderColor: colors.border },
              ]}
            >
              <View style={styles.sheetHeader}>
                <Text
                  style={[
                    { color: colors.text, fontSize: 18, fontWeight: "600" },
                    font,
                  ]}
                >
                  {t("wallet.addFunds")}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <X size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
                  font,
                ]}
              >
                {t("wallet.amountEur")}
              </Text>
              <Text
                style={[
                  { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
                  font,
                ]}
              >
                {t("wallet.rtlMoneyEntryHint")}
              </Text>
              <RtlMoneyAmountField
                buffer={rtlBuffer}
                onBufferChange={setRtlBuffer}
                maxCents={MAX_TOP_UP_CENTS}
                disabled={busy}
                currencyCode="EUR"
                containerStyle={{ marginBottom: 16 }}
              />
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: busy ? 0.7 : 1,
                  },
                ]}
                onPress={handlePay}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[{ color: "#fff", fontSize: 16 }, font]}>
                    {t("wallet.continueToPayment")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WalletTopUpModalRoot({
  visible,
  onClose,
  onSuccess,
  publishableKey,
}: Props) {
  return (
    <StripeProvider publishableKey={publishableKey} urlScheme="myapp">
      <WalletTopUpModalBody
        visible={visible}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </StripeProvider>
  );
}

export default WalletTopUpModalRoot;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "#000000",
  },
  sheetWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    paddingHorizontal: 20,
    pointerEvents: "box-none",
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
});
