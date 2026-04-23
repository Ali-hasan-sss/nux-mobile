import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  DeviceEventEmitter,
  InteractionManager,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/contexts/AlertContext";
import type { NewGiftVoucherRequestPayload } from "@/api/walletPaymentApi";
import {
  fetchPaymentSecurity,
  approveWalletGiftVoucher,
  rejectWalletGiftVoucher,
  type PaymentSecurity,
} from "@/api/walletPaymentApi";
import { getOrCreateWalletDeviceId } from "@/lib/deviceId";
import {
  normalizePaymentPinDigits,
  isAsciiPinDigits,
} from "@/lib/normalizePinDigits";
import { getApiErrorMessage } from "@/lib/apiError";
import { CustomAlert } from "@/components/CustomAlert";
import { router } from "expo-router";
import { Text } from "@/components/AppText";

type Props = {
  visible: boolean;
  payload: NewGiftVoucherRequestPayload | null;
  onDismiss: () => void;
};

export function GiftVoucherApprovalModal({ visible, payload, onDismiss }: Props) {
  const { t } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const { showToast } = useAlert();

  const [pin, setPin] = useState("");
  const [security, setSecurity] = useState<PaymentSecurity | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [biometricFallbackToPin, setBiometricFallbackToPin] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [needPinAlertVisible, setNeedPinAlertVisible] = useState(false);

  const reset = useCallback(() => {
    setPin("");
    setSecurity(null);
    setBiometricFallbackToPin(false);
    setBiometricReady(false);
    setNeedPinAlertVisible(false);
  }, []);

  useEffect(() => {
    if (!visible || !payload) {
      reset();
      return;
    }
    let cancelled = false;
    setLoadingSecurity(true);
    getOrCreateWalletDeviceId()
      .then((deviceId) => fetchPaymentSecurity(deviceId))
      .then(async (s) => {
        if (cancelled) return;
        setSecurity(s);
        const has = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!cancelled) setBiometricReady(Boolean(has && enrolled));
      })
      .catch(() => {
        if (!cancelled) {
          setSecurity(null);
          setBiometricReady(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSecurity(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, payload, reset]);

  const handleReject = async () => {
    if (!payload) return;
    try {
      await rejectWalletGiftVoucher(payload.approvalId);
    } catch {
      // Ignore reject failures on dismiss.
    }
    reset();
    onDismiss();
  };

  const goSetPaymentPin = () => {
    setNeedPinAlertVisible(false);
    reset();
    onDismiss();
    router.navigate({
      pathname: "/(tabs)/account",
      params: { focusPaymentPin: "1" },
    } as never);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        DeviceEventEmitter.emit("account:scrollToPaymentPin");
      }, 400);
    });
  };

  const handleApprove = async () => {
    if (!payload) return;
    if (!security?.hasPin) {
      setNeedPinAlertVisible(true);
      return;
    }

    const deviceTrusted = security.currentDeviceTrusted === true;
    const useBiometricFirst = Boolean(
      deviceTrusted &&
        security.biometricEnabled &&
        biometricReady &&
        !biometricFallbackToPin
    );

    let pinNormForSubmit: string | undefined;
    if (useBiometricFirst) {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: t("walletPayment.biometricPrompt"),
        cancelLabel: t("common.cancel"),
        disableDeviceFallback: Platform.OS === "ios",
      });
      if (!r.success) {
        setBiometricFallbackToPin(true);
        showToast({
          message: t(
            "walletPayment.biometricFailedUsePin",
            "Biometric not available or cancelled. Enter your payment PIN to approve."
          ),
          type: "error",
        });
        return;
      }
      pinNormForSubmit = undefined;
    } else {
      const pinNorm = normalizePaymentPinDigits(pin);
      if (!isAsciiPinDigits(pinNorm)) {
        showToast({
          message: t(
            "walletPayment.pinFormatInvalid",
            "Enter 6–12 digits (0–9 only). Eastern Arabic / Persian digits are accepted."
          ),
          type: "error",
        });
        return;
      }
      pinNormForSubmit = pinNorm;
    }

    setSubmitting(true);
    try {
      const deviceId = await getOrCreateWalletDeviceId();
      await approveWalletGiftVoucher({
        approvalId: payload.approvalId,
        approvalToken: payload.approvalToken,
        ...(pinNormForSubmit ? { pin: pinNormForSubmit } : {}),
        deviceId,
        deviceName: `${Platform.OS} device`,
      });
      showToast({
        message: t("purchase.giftVoucherApproved", "Gift sent successfully"),
        type: "success",
      });
      DeviceEventEmitter.emit("wallet:balanceChanged");
      reset();
      onDismiss();
    } catch (e: unknown) {
      showToast({
        message: getApiErrorMessage(e, t("common.error", "Something went wrong")),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!payload) return null;
  const expired =
    payload.expiresAt != null && new Date(payload.expiresAt).getTime() <= Date.now();
  const cardBg = isDark ? colors.surface : colors.background;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleReject}
      >
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.title, { color: colors.text }, font]}>
              {t("purchase.giftVoucherApproveTitle", "Confirm gift voucher")}
            </Text>
            <Text style={[{ color: colors.textSecondary, marginTop: 8 }, font]}>
              {t("purchase.giftVoucherRecipient", "Recipient")}:{" "}
              {payload.recipientName || payload.recipientUserId}
            </Text>
            <Text style={[{ color: colors.text, marginTop: 4 }, font]}>
              {t("walletPayment.amount")}: {payload.amount} {payload.currency}
            </Text>

            {loadingSecurity ? (
              <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
            ) : !security?.hasPin ? (
              <View style={{ marginTop: 16, width: "100%" }}>
                <Text style={[{ color: colors.error }, font]}>
                  {t("walletPayment.needPin")}
                </Text>
                <TouchableOpacity
                  style={[styles.setPinBtn, { backgroundColor: colors.primary, marginTop: 14 }]}
                  onPress={goSetPaymentPin}
                  activeOpacity={0.85}
                >
                  <Text style={[{ color: "#fff", fontWeight: "600" }, font]}>
                    {t("walletPayment.setPaymentPinCta")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : expired ? (
              <Text style={[{ color: colors.error, marginTop: 16 }, font]}>
                {t("walletPayment.expired")}
              </Text>
            ) : (
              <>
                {(security?.currentDeviceTrusted !== true ||
                  !security?.biometricEnabled ||
                  !biometricReady ||
                  biometricFallbackToPin) && (
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, marginTop: 12 },
                      font,
                    ]}
                    placeholder={t("walletPayment.enterPin")}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={12}
                    value={pin}
                    onChangeText={setPin}
                  />
                )}
              </>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline, { borderColor: colors.border }]}
                onPress={() => void handleReject()}
                disabled={submitting}
              >
                <Text style={[{ color: colors.text }, font]}>{t("walletPayment.reject")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 },
                ]}
                onPress={() => void handleApprove()}
                disabled={submitting || loadingSecurity || expired}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[{ color: "#fff" }, font]}>
                    {t("walletPayment.approve")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={needPinAlertVisible}
        type="warning"
        title={t("walletPayment.needPinAlertTitle")}
        message={t("walletPayment.needPin")}
        cancelText={t("common.close")}
        confirmText={t("walletPayment.setPaymentPinCta")}
        onCancel={() => setNeedPinAlertVisible(false)}
        onConfirm={goSetPaymentPin}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    borderWidth: 1,
  },
  setPinBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
