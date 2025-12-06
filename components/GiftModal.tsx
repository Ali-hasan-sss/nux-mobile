import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { Camera } from "lucide-react-native";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { useBalance } from "@/hooks/useBalance";
import { useProfile } from "@/hooks/useProfile";
import { giftPoints } from "@/store/slices/balanceSlice";
import { useLocalSearchParams, router } from "expo-router";
import { useAlert } from "@/contexts/AlertContext";

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: string;
}

export default function GiftModal({
  visible,
  onClose,
  targetId,
}: GiftModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { currentBalance, loadBalances } = useBalance();
  const { profile } = useProfile();
  const params = useLocalSearchParams();
  const { showToast, showAlert } = useAlert();

  // State for gift form
  const [selectedGiftType, setSelectedGiftType] = useState<
    "wallet" | "drink" | "meal"
  >("wallet");
  const [giftAmount, setGiftAmount] = useState("");
  const [scannedQRCode, setScannedQRCode] = useState("");
  const [isGiftProcessing, setIsGiftProcessing] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setGiftAmount("");
      setSelectedGiftType("wallet");
      setScannedQRCode("");
      setQrScanned(false);
      setScanModalVisible(false);
      setAutoTriggered(false);
    }
  }, [visible]);

  // Listen to camera scan event and handle QR data
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "gift-scanned",
      (data: string) => {
        console.log("📱 GiftModal received scanned QR:", data);
        setScannedQRCode(data);
        setQrScanned(true);

        const amountNumber = parseFloat(giftAmount.replace(",", "."));
        if (
          visible &&
          !autoTriggered &&
          !isGiftProcessing &&
          giftAmount &&
          !Number.isNaN(amountNumber) &&
          amountNumber > 0
        ) {
          setAutoTriggered(true);
          setTimeout(() => {
            sendGift(data);
          }, 50);
        }
      }
    );
    return () => {
      sub.remove();
    };
  }, [visible, giftAmount, autoTriggered, isGiftProcessing]);

  // Auto-send gift after successful scan when amount is present
  useEffect(() => {
    if (
      visible &&
      qrScanned &&
      scannedQRCode &&
      scannedQRCode.trim() !== "" &&
      giftAmount &&
      parseFloat(giftAmount.replace(",", ".")) > 0 &&
      !isGiftProcessing &&
      !autoTriggered
    ) {
      setAutoTriggered(true);
      // small delay to allow UI to settle
      setTimeout(() => {
        sendGift();
      }, 100);
    }
  }, [
    visible,
    qrScanned,
    scannedQRCode,
    giftAmount,
    isGiftProcessing,
    autoTriggered,
  ]);

  const handleScanForGift = () => {
    if (!giftAmount || parseFloat(giftAmount) <= 0) {
      showToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }

    // Navigate directly to camera scanner screen
    router.push("/camera/gift-scan");
  };

  const handleScanModalClose = () => {
    setScanModalVisible(false);
  };

  // Upload from gallery is not used in this flow

  const sendGift = async (overrideQrCode?: string) => {
    if (!giftAmount || parseFloat(giftAmount) <= 0) {
      showToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }

    const effectiveQr = ((overrideQrCode ?? scannedQRCode) || "").trim();
    if (!effectiveQr) {
      showToast({
        message: "Invalid QR code. Please scan again.",
        type: "error",
      });
      return;
    }

    // Check if user is trying to gift to themselves
    console.log("🔍 Checking if user is trying to gift to themselves:");
    console.log("🔍 Scanned QR Code:", scannedQRCode);
    console.log("🔍 Current User QR Code:", profile?.qrCode);
    console.log(
      "🔍 QR Code types:",
      typeof scannedQRCode,
      typeof profile?.qrCode
    );
    console.log(
      "🔍 QR Code lengths:",
      scannedQRCode?.length,
      profile?.qrCode?.length
    );
    console.log("🔍 Are they equal?", scannedQRCode === profile?.qrCode);
    console.log(
      "🔍 Are they similar?",
      scannedQRCode?.includes(profile?.qrCode || "") ||
        profile?.qrCode?.includes(scannedQRCode || "")
    );

    if (scannedQRCode === profile?.qrCode) {
      console.log("❌ User trying to gift to themselves - exact match!");
      showToast({
        message:
          "You cannot gift to yourself. Please scan another user's QR code.",
        type: "error",
      });
      return;
    }

    // Additional check for similar QR codes (only if both are not empty)
    if (
      profile?.qrCode &&
      scannedQRCode &&
      profile.qrCode.length > 0 &&
      scannedQRCode.length > 0
    ) {
      if (
        scannedQRCode.includes(profile.qrCode) ||
        profile.qrCode.includes(scannedQRCode)
      ) {
        console.log("❌ QR codes are similar:");
        console.log("❌ Scanned QR Code:", scannedQRCode);
        console.log("❌ Current User QR Code:", profile?.qrCode);
        showToast({
          message:
            "This QR code appears to be yours. Please scan another user's QR code.",
          type: "error",
        });
        return;
      }
    }

    // Log the comparison for debugging
    console.log("✅ QR Code comparison passed:");
    console.log("✅ Scanned QR Code:", effectiveQr);
    console.log("✅ Current User QR Code:", profile?.qrCode);
    console.log("✅ Proceeding with gift...");
    console.log("✅ Are they the same?", scannedQRCode === profile?.qrCode);

    // Validate amount against available balance
    const amount = parseFloat(giftAmount.replace(",", "."));
    let availableBalance = 0;

    switch (selectedGiftType) {
      case "wallet":
        availableBalance = currentBalance.walletBalance;
        break;
      case "meal":
        availableBalance = currentBalance.mealPoints;
        break;
      case "drink":
        availableBalance = currentBalance.drinkPoints;
        break;
    }

    if (amount > availableBalance) {
      showToast({
        message: `Insufficient balance. Available: ${availableBalance} ${
          selectedGiftType === "wallet" ? "$" : "points"
        }`,
        type: "error",
      });
      return;
    }

    setIsGiftProcessing(true);

    try {
      const giftData = {
        targetId: targetId,
        amount: parseFloat(giftAmount),
        currencyType: (selectedGiftType === "wallet"
          ? "balance"
          : selectedGiftType === "meal"
          ? "stars_meal"
          : "stars_drink") as "balance" | "stars_meal" | "stars_drink",
        qrCode: effectiveQr,
      };

      console.log("🎁 Sending gift with data:", giftData);
      console.log("🎁 Current user QR code:", profile?.qrCode);
      console.log("🎁 Scanned QR code:", scannedQRCode);

      const result = await dispatch(giftPoints(giftData) as any);

      if (result.type.endsWith("/fulfilled")) {
        // Toast success
        const successMsg = "Gift sent successfully!";
        showToast({ message: successMsg, type: "success" });
        // Close modal and navigate to stable screen
        onClose();
        router.replace("/(tabs)/purchase");
        setGiftAmount("");
        setScannedQRCode("");
        setQrScanned(false);
        setAutoTriggered(false);
        // Refresh balances
        loadBalances();
      } else {
        const errorMessage =
          (result.payload as string) || "Failed to send gift";
        console.log("❌ Gift failed with error:", errorMessage);

        if (errorMessage.includes("Recipient not found")) {
          showToast({
            message:
              "The scanned QR code does not belong to any user. Please scan a valid QR code.",
            type: "error",
          });
        } else {
          showToast({ message: errorMessage, type: "error" });
        }
        // Allow retry
        setAutoTriggered(false);
      }
    } catch (error: any) {
      showToast({
        message: error.message || "Failed to send gift",
        type: "error",
      });
      // Allow retry
      setAutoTriggered(false);
    } finally {
      setIsGiftProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing modal
    setGiftAmount("");
    setSelectedGiftType("wallet");
    setScannedQRCode("");
    setQrScanned(false);
    setScanModalVisible(false);
    onClose();
  };

  return (
    <>
      {/* Gift Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("purchase.giftOptions")}
            </Text>

            <View style={styles.giftTypeContainer}>
              {[
                {
                  type: "wallet",
                  label: t("purchase.walletBalance"),
                  balance: currentBalance.walletBalance,
                  symbol: "$",
                },
                {
                  type: "drink",
                  label: t("purchase.drinkPoints"),
                  balance: currentBalance.drinkPoints,
                  symbol: "⭐",
                },
                {
                  type: "meal",
                  label: t("purchase.mealPoints"),
                  balance: currentBalance.mealPoints,
                  symbol: "⭐",
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.giftTypeButton,
                    {
                      backgroundColor:
                        selectedGiftType === option.type
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        selectedGiftType === option.type
                          ? colors.primary
                          : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setSelectedGiftType(option.type as any)}
                >
                  <View style={styles.giftTypeContent}>
                    <Text
                      style={[
                        styles.giftTypeText,
                        {
                          color:
                            selectedGiftType === option.type
                              ? "white"
                              : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.giftTypeBalance,
                        {
                          color:
                            selectedGiftType === option.type
                              ? "white"
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {option.balance} {option.symbol}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.amountInput,
                { backgroundColor: colors.background, color: colors.text },
              ]}
              placeholder={t("purchase.amount")}
              placeholderTextColor={colors.textSecondary}
              value={giftAmount}
              onChangeText={setGiftAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.scanTitle, { color: colors.text }]}>
              {t("purchase.scanOrUpload")}
            </Text>

            {qrScanned ? (
              <View
                style={[
                  styles.scannedQRContainer,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.scannedQRHeader}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                  <Text style={[styles.scannedQRText, { color: colors.text }]}>
                    Recipient selected successfully!
                  </Text>
                </View>
                {/* Auto-sending after scan; no rescan button in this flow */}
              </View>
            ) : (
              <View style={styles.scanOptions}>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: !giftAmount ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleScanForGift}
                  disabled={!giftAmount}
                >
                  <Camera size={20} color="white" />
                  <Text style={styles.scanButtonText}>
                    {!giftAmount ? "Enter Amount First" : "Scan QR Code"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.border,
                    opacity: isGiftProcessing ? 0.5 : 1,
                  },
                ]}
                onPress={handleClose}
                disabled={isGiftProcessing}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {isGiftProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingContent}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingText}>Sending gift...</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Direct camera navigation used; no intermediate ScanModal */}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  giftTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  giftTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  giftTypeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  amountInput: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  scanOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  scannedQRContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  scannedQRText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 4,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingContent: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    color: "#fff",
    marginTop: 8,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  giftTypeContent: {
    alignItems: "center",
  },
  giftTypeBalance: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  scannedQRHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkIconText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  rescanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
