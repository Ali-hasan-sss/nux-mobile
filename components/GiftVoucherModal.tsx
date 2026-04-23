import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/contexts/AlertContext";
import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Upload, ScanLine, X } from "lucide-react-native";
import { requestWalletGiftVoucher } from "@/api/walletPaymentApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { CustomAlert } from "@/components/CustomAlert";
import { router } from "expo-router";
import type { TFunction } from "i18next";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const FIXED_AMOUNTS: Array<10 | 20 | 25 | 50> = [10, 20, 25, 50];
const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const QR_PAYLOAD_PREFIX = "LOLITY_USER:";

type RecipientPreview = {
  code: string;
  email?: string;
  name?: string;
};

function extractRecipientData(raw: string): RecipientPreview | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const parsePayload = (value: string): RecipientPreview | null => {
    try {
      const parsed = JSON.parse(value) as {
        userId?: string;
        id?: string;
        email?: string;
        fullName?: string;
        name?: string;
      };
      const code = String(parsed.userId ?? parsed.id ?? "").trim();
      if (!code) return null;
      return {
        code,
        email: typeof parsed.email === "string" ? parsed.email : undefined,
        name:
          typeof parsed.fullName === "string"
            ? parsed.fullName
            : typeof parsed.name === "string"
              ? parsed.name
              : undefined,
      };
    } catch {
      return null;
    }
  };

  if (trimmed.startsWith(QR_PAYLOAD_PREFIX)) {
    const fromPrefixed = parsePayload(trimmed.slice(QR_PAYLOAD_PREFIX.length));
    if (fromPrefixed) return fromPrefixed;
  }

  const fromJson = parsePayload(trimmed);
  if (fromJson) return fromJson;

  const match = trimmed.match(UUID_REGEX);
  if (!match?.[0]) return null;
  return { code: match[0] };
}

function getGiftVoucherModalErrorMessage(
  e: unknown,
  t: TFunction
): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const apiMessage =
      typeof e.response?.data?.message === "string" ? e.response.data.message : "";

    if (status === 428) {
      return t(
        "purchase.giftVoucherNeedPin",
        "يجب إعداد رقم PIN للدفع من شاشة الحساب قبل إرسال الإهداء."
      );
    }
    if (status === 404 && apiMessage.toLowerCase().includes("recipient")) {
      return t(
        "purchase.giftVoucherRecipientNotFound",
        "لم يتم العثور على المستلم. تأكد من مسح كود مستخدم صحيح."
      );
    }
    if (status === 400 && apiMessage.toLowerCase().includes("yourself")) {
      return t(
        "purchase.giftVoucherSelfNotAllowed",
        "لا يمكنك إرسال إهداء إلى حسابك."
      );
    }
  }
  return getApiErrorMessage(e, t("common.error", "Something went wrong"));
}

export default function GiftVoucherModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const { showToast } = useAlert();
  const [selectedAmount, setSelectedAmount] = useState<10 | 20 | 25 | 50>(10);
  const [recipientCode, setRecipientCode] = useState<string>("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing] = useState<"back" | "front">("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [sending, setSending] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [needPinAlertVisible, setNeedPinAlertVisible] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(recipientCode) && !sending, [recipientCode, sending]);

  useEffect(() => {
    if (!visible) {
      setCameraOpen(false);
      setRecipientCode("");
      setSelectedAmount(10);
      setSending(false);
      setModalError(null);
      setNeedPinAlertVisible(false);
      setRecipientEmail(null);
      setRecipientName(null);
    }
  }, [visible]);

  const goSetPaymentPin = () => {
    setNeedPinAlertVisible(false);
    onClose();
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

  const submitGiftRequest = async () => {
    if (!canSubmit) return;
    setSending(true);
    setModalError(null);
    try {
      await requestWalletGiftVoucher({
        recipientCode,
        amount: selectedAmount,
      });
      showToast({
        message: t(
          "purchase.giftVoucherPending",
          "Gift request sent. Confirm on your trusted mobile device."
        ),
        type: "success",
      });
      onClose();
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 428) {
        setNeedPinAlertVisible(true);
      }
      const message = getGiftVoucherModalErrorMessage(e, t);
      setModalError(message);
      showToast({
        message,
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleScanCode = (raw: string) => {
    if (scanBusy) return;
    setScanBusy(true);
    const recipient = extractRecipientData(raw);
    if (!recipient?.code) {
      showToast({
        message: t(
          "purchase.giftVoucherInvalidCode",
          "Invalid recipient code. Please scan a valid user code."
        ),
        type: "error",
      });
      setTimeout(() => setScanBusy(false), 600);
      return;
    }
    setRecipientCode(recipient.code);
    setRecipientEmail(recipient.email ?? null);
    setRecipientName(recipient.name ?? null);
    setModalError(null);
    setCameraOpen(false);
    showToast({
      message: t("purchase.giftVoucherRecipientScanned", "Recipient code detected"),
      type: "success",
    });
    setTimeout(() => setScanBusy(false), 600);
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const p = await requestCameraPermission();
      if (!p.granted) {
        Alert.alert(
          t("common.error", "Error"),
          t("purchase.giftVoucherCameraDenied", "Camera permission is required")
        );
        return;
      }
    }
    setCameraOpen(true);
  };

  const pickFromGallery = async () => {
    try {
      const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!p.granted) {
        showToast({
          message: t(
            "purchase.giftVoucherGalleryDenied",
            "Gallery permission is required"
          ),
          type: "error",
        });
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      if (picked.canceled || picked.assets.length === 0) return;

      const uri = picked.assets[0]?.uri;
      if (!uri) return;
      const result = await Camera.scanFromURLAsync(uri, ["qr"]);
      const first = result?.[0]?.data;
      if (!first) {
        showToast({
          message: t(
            "purchase.giftVoucherNoQrInImage",
            "No QR code found in selected image."
          ),
          type: "error",
        });
        return;
      }
      const recipient = extractRecipientData(first);
      if (!recipient?.code) {
        showToast({
          message: t(
            "purchase.giftVoucherInvalidCode",
            "Invalid recipient code. Please scan a valid user code."
          ),
          type: "error",
        });
        return;
      }
      setRecipientCode(recipient.code);
      setRecipientEmail(recipient.email ?? null);
      setRecipientName(recipient.name ?? null);
      setModalError(null);
      showToast({
        message: t("purchase.giftVoucherRecipientScanned", "Recipient code detected"),
        type: "success",
      });
    } catch (e: unknown) {
      showToast({
        message: getApiErrorMessage(
          e,
          t("purchase.giftVoucherImageScanFailed", "Could not read QR from image")
        ),
        type: "error",
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }, font]}>
            {t("purchase.giftVoucherTitle", "Gift voucher")}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {!cameraOpen ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }, font]}>
              {t("purchase.giftVoucherAmount", "Choose voucher amount")}
            </Text>
            <View style={styles.amountRow}>
              {FIXED_AMOUNTS.map((amount) => {
                const active = selectedAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setSelectedAmount(amount)}
                    style={[
                      styles.amountBtn,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "18" : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[{ color: active ? colors.primary : colors.text }, font]}>
                      {amount} EUR
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }, font]}>
              {t("purchase.giftVoucherRecipient", "Recipient code")}
            </Text>
            <View
              style={[
                styles.codeBox,
                { borderColor: colors.border, backgroundColor: isDark ? colors.surface : "#fff" },
              ]}
            >
              <Text style={[{ color: recipientCode ? colors.text : colors.textSecondary }, font]}>
                {recipientCode ||
                  t(
                    "purchase.giftVoucherNoRecipient",
                    "No recipient selected yet. Scan or upload friend code."
                  )}
              </Text>
            </View>
            {recipientEmail || recipientName ? (
              <View
                style={[
                  styles.recipientInfoBox,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.surface : "#fff",
                  },
                ]}
              >
                {recipientName ? (
                  <Text style={[styles.recipientInfoText, { color: colors.text }, font]}>
                    {recipientName}
                  </Text>
                ) : null}
                {recipientEmail ? (
                  <Text
                    style={[styles.recipientInfoText, { color: colors.textSecondary }, font]}
                  >
                    {recipientEmail}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => void openCamera()}
              >
                <ScanLine size={18} color="#fff" />
                <Text style={[styles.actionBtnText, font]}>
                  {t("purchase.giftVoucherScan", "Scan code")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => void pickFromGallery()}
              >
                <Upload size={18} color="#fff" />
                <Text style={[styles.actionBtnText, font]}>
                  {t("purchase.giftVoucherUpload", "Upload from gallery")}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: canSubmit ? colors.primary : colors.textSecondary,
                  opacity: sending ? 0.7 : 1,
                },
              ]}
              disabled={!canSubmit || sending}
              onPress={() => void submitGiftRequest()}
              activeOpacity={0.85}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, font]}>
                  {canSubmit
                    ? t("purchase.giftVoucherSend", "Send gift")
                    : t("purchase.giftVoucherNeedRecipient", "Scan recipient code first")}
                </Text>
              )}
            </TouchableOpacity>

            {modalError ? (
              <Text style={[styles.modalErrorText, { color: colors.error }, font]}>
                {modalError}
              </Text>
            ) : null}
          </>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing={cameraFacing}
              onBarcodeScanned={({ data }) => handleScanCode(String(data || ""))}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            <TouchableOpacity
              style={[styles.closeCameraBtn, { backgroundColor: colors.error }]}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={[styles.actionBtnText, font]}>{t("common.close", "Close")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    marginBottom: 10,
    marginTop: 6,
  },
  amountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  amountBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  recipientInfoBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: -6,
    marginBottom: 16,
    gap: 4,
  },
  recipientInfoText: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  submitBtnText: {
    textAlign: "center",
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  cameraWrap: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  camera: {
    width: "100%",
    height: 460,
    borderRadius: 16,
    overflow: "hidden",
  },
  closeCameraBtn: {
    alignSelf: "center",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalErrorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
