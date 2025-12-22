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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import {
  Camera,
  Coffee,
  UtensilsCrossed,
  Wallet,
  Image as ImageIcon,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
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
  const [amountError, setAmountError] = useState<string>("");
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isScanScreenOpen, setIsScanScreenOpen] = useState(false); // Track if scan screen is open

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setGiftAmount("");
      setSelectedGiftType("wallet");
      setScannedQRCode("");
      setQrScanned(false);
      setScanModalVisible(false);
      setAutoTriggered(false);
      setAmountError("");
      setIsScanScreenOpen(false);
    }
  }, [visible]);

  // Validate amount against balance when amount or gift type changes
  useEffect(() => {
    if (!giftAmount || giftAmount.trim() === "") {
      setAmountError("");
      return;
    }

    const amount = parseFloat(giftAmount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      setAmountError("");
      return;
    }

    let availableBalance = 0;
    let balanceType = "";

    switch (selectedGiftType) {
      case "wallet":
        availableBalance = currentBalance.walletBalance;
        balanceType = "$";
        break;
      case "meal":
        availableBalance = currentBalance.mealPoints;
        balanceType = t("purchase.mealPoints");
        break;
      case "drink":
        availableBalance = currentBalance.drinkPoints;
        balanceType = t("purchase.drinkPoints");
        break;
    }

    if (amount > availableBalance) {
      const errorMessage = `Insufficient balance. Available: ${availableBalance} ${balanceType}`;
      setAmountError(errorMessage);
    } else {
      setAmountError("");
    }
  }, [giftAmount, selectedGiftType, currentBalance, t]);

  // Listen to camera scan event and handle QR data
  useEffect(() => {
    const scanSub = DeviceEventEmitter.addListener(
      "gift-scanned",
      (data: string) => {
        console.log("📱 GiftModal received scanned QR:", data);
        setScannedQRCode(data);
        setQrScanned(true);
        setIsScanScreenOpen(false); // Mark scan screen as closed

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

    // Listen for scan screen close event (when user closes without scanning)
    const closeSub = DeviceEventEmitter.addListener("gift-scan-closed", () => {
      console.log("📱 GiftModal: Scan screen closed");
      setIsScanScreenOpen(false); // Mark scan screen as closed
    });

    return () => {
      scanSub.remove();
      closeSub.remove();
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
    if (!giftAmount || parseFloat(giftAmount.replace(",", ".")) <= 0) {
      showToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }

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
        message:
          amountError ||
          `Insufficient balance. Available: ${availableBalance} ${
            selectedGiftType === "wallet" ? "$" : "points"
          }`,
        type: "error",
      });
      return;
    }

    // Keep modal open but mark scan screen as open
    setIsScanScreenOpen(true);

    // Navigate to scan screen without closing modal
    router.push("/camera/gift-scan");
  };

  const handleScanModalClose = () => {
    setScanModalVisible(false);
  };

  const handlePickImageFromGallery = async () => {
    if (!giftAmount || parseFloat(giftAmount.replace(",", ".")) <= 0) {
      showToast({ message: "Please enter a valid amount", type: "error" });
      return;
    }

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
        message:
          amountError ||
          `Insufficient balance. Available: ${availableBalance} ${
            selectedGiftType === "wallet" ? "$" : "points"
          }`,
        type: "error",
      });
      return;
    }

    try {
      setIsPickingImage(true);

      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast({
          message: "Permission to access media library is required",
          type: "error",
        });
        setIsPickingImage(false);
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        setIsPickingImage(false);
        return;
      }

      const imageUri = result.assets[0].uri;

      // Scan QR code from the selected image
      // Since expo-camera doesn't support scanning from image URI directly,
      // we'll use a workaround: create a temporary CameraView component
      // that can scan the image, or use backend API

      // For now, let's use a simpler approach: navigate to a scan screen
      // that can handle image scanning, or use backend API

      // Actually, the best solution is to use expo-camera's BarCodeScanner
      // with a workaround: we can create a hidden CameraView and use it to scan
      // But that's complex. Let's use a different approach:

      // Use the image URI and try to extract QR code using expo-camera
      // We'll need to create a temporary component that uses CameraView
      // to scan the image

      // For now, let's show a message and redirect to camera scan
      // with the image URI as a parameter
      showToast({
        message: "Processing image...",
        type: "info",
      });

      // For now, since expo-camera doesn't support scanning from image URI directly,
      // we'll show a helpful message and suggest using the camera
      // TODO: Implement backend API endpoint for QR scanning from image
      // or use a library like react-native-qrcode-scanner

      showToast({
        message:
          "QR scanning from gallery images is not yet supported. Please use the camera to scan QR codes.",
        type: "info",
      });
    } catch (error: any) {
      console.error("Error picking image:", error);
      showToast({
        message: error?.message || "Failed to pick image",
        type: "error",
      });
    } finally {
      setIsPickingImage(false);
    }
  };

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
        // Reset form state
        setGiftAmount("");
        setScannedQRCode("");
        setQrScanned(false);
        setAutoTriggered(false);
        setIsScanScreenOpen(false);
        // Refresh balances
        loadBalances();
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
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
        <KeyboardAvoidingView
          style={[
            styles.modalOverlay,
            {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              opacity: isScanScreenOpen ? 0 : 1, // Hide visually when scan screen is open
              pointerEvents: isScanScreenOpen ? "none" : "auto", // Disable interactions when scan screen is open
            },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.surfaceSolid },
              ]}
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
                    icon: Wallet,
                    iconColor: colors.success,
                  },
                  {
                    type: "drink",
                    label: t("purchase.drinkPoints"),
                    balance: currentBalance.drinkPoints,
                    symbol: "",
                    icon: Coffee,
                    iconColor: colors.secondary,
                  },
                  {
                    type: "meal",
                    label: t("purchase.mealPoints"),
                    balance: currentBalance.mealPoints,
                    symbol: "",
                    icon: UtensilsCrossed,
                    iconColor: colors.primary,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
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
                        <Icon
                          size={20}
                          color={
                            selectedGiftType === option.type
                              ? "white"
                              : option.iconColor
                          }
                        />
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
                  );
                })}
              </View>

              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: amountError ? colors.error : colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder={t("purchase.amount")}
                placeholderTextColor={colors.textSecondary}
                value={giftAmount}
                onChangeText={setGiftAmount}
                keyboardType="numeric"
              />
              {amountError && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {amountError}
                </Text>
              )}

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
                    <Text
                      style={[styles.scannedQRText, { color: colors.text }]}
                    >
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
                        opacity: !giftAmount || isPickingImage ? 0.5 : 1,
                      },
                    ]}
                    onPress={handleScanForGift}
                    disabled={!giftAmount || isPickingImage}
                  >
                    {isPickingImage ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Camera size={20} color="white" />
                    )}
                    <Text style={styles.scanButtonText}>
                      {!giftAmount ? "Enter Amount First" : "Scan QR Code"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.scanButton,
                      {
                        backgroundColor: colors.secondary,
                        opacity: !giftAmount || isPickingImage ? 0.5 : 1,
                      },
                    ]}
                    onPress={handlePickImageFromGallery}
                    disabled={!giftAmount || isPickingImage}
                  >
                    {isPickingImage ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <ImageIcon size={20} color="white" />
                    )}
                    <Text style={styles.scanButtonText}>
                      {!giftAmount ? "Enter Amount First" : "From Gallery"}
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
                  <Text
                    style={[styles.modalButtonText, { color: colors.text }]}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          {isGiftProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingContent}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.processingText}>Sending gift...</Text>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Direct camera navigation used; no intermediate ScanModal */}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
    gap: 4,
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
