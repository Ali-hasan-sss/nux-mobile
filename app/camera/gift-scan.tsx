import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Alert, DeviceEventEmitter, ActivityIndicator } from "react-native";
import { Text } from "@/components/AppText";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { X, Check, CheckCircle, XCircle } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import * as ImageManipulator from "expo-image-manipulator";

export default function GiftScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>("");
  const [showCamera, setShowCamera] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({
    visible: false,
    type: "success",
    message: "",
  });
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string | undefined;

  // Handle image scanning if imageUri is provided
  useEffect(() => {
    if (imageUri && !scanned && !isProcessing) {
      scanQRFromImage(imageUri);
    }
  }, [imageUri]);

  useEffect(() => {
    if (permission && !permission.granted && !imageUri) {
      requestPermission();
    }
  }, [permission, requestPermission, imageUri]);

  const scanQRFromImage = async (uri: string) => {
    try {
      setIsProcessing(true);
      setShowCamera(false);

      // Resize image if needed for better scanning
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Use CameraView to scan the image
      // Note: expo-camera doesn't directly support scanning from URI
      // We'll need to use a workaround or backend API

      // For now, let's show a message that image scanning needs backend support
      showToast(
        "error",
        "Image scanning requires backend API support. Please use the camera to scan QR codes."
      );
      setIsProcessing(false);
      setShowCamera(true);

      // TODO: Implement backend API endpoint for QR scanning from image
      // or use a library that supports image scanning
    } catch (error: any) {
      console.error("Error scanning QR from image:", error);
      showToast(
        "error",
        "Failed to scan QR code from image. Please use the camera instead."
      );
      setIsProcessing(false);
      setShowCamera(true);
    }
  };

  // Toast
  const showToast = (type: "success" | "error", message: string) => {
    setToast({
      visible: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isProcessing) return; // Prevent multiple scans

    setScanned(true);
    setScannedData(data);

    setShowCamera(false);
    setIsProcessing(true);

    try {
      // Emit event for listeners (e.g., GiftModal)
      DeviceEventEmitter.emit("gift-scanned", data);

      // عرض رسالة النجاح
      showToast("success", "تم مسح الكود بنجاح!");

      // الانتظار قليلاً ثم العودة
      setTimeout(() => {
        // Emit event to notify GiftModal that scan screen is closing
        DeviceEventEmitter.emit("gift-scan-closed");
        router.back();
      }, 1500);
    } catch (e) {
      showToast("error", "حدث خطأ أثناء معالجة الكود");
      setIsProcessing(false);
      setShowCamera(true);
      setScanned(false);
    }
  };

  const handleRescan = () => {
    setScanned(false);
    setScannedData("");
    setShowCamera(true);
    setIsProcessing(false);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Loader Screen - يظهر بدلاً من الكاميرا أثناء المعالجة */}
      {!showCamera && isProcessing && (
        <View
          style={[
            styles.fullScreenLoader,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.fullScreenLoaderText, { color: colors.text }]}>
              جاري معالجة الكود...
            </Text>
            <Text
              style={[
                styles.fullScreenLoaderSubtext,
                { color: colors.textSecondary },
              ]}
            >
              الرجاء الانتظار
            </Text>
          </View>
        </View>
      )}

      {/* Camera View - يظهر فقط عندما showCamera === true */}
      {showCamera && (
        <View style={styles.container}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => {
                  // Emit event to notify GiftModal that scan screen is closing
                  DeviceEventEmitter.emit("gift-scan-closed");
                  router.back();
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                {scanned && (
                  <View style={styles.successBadge}>
                    <Check size={32} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.instructionText}>
                {scanned
                  ? `Recipient found! Returning to gift form...`
                  : "Scan your friend's QR code to send a gift"}
              </Text>
              {scanned && (
                <TouchableOpacity
                  style={[
                    styles.rescanButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleRescan}
                >
                  <Text style={styles.rescanButtonText}>Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Toast */}
      {toast.visible && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor:
                toast.type === "success" ? colors.success : colors.error,
            },
          ]}
        >
          <View style={styles.toastContent}>
            {toast.type === "success" ? (
              <CheckCircle size={20} color="white" />
            ) : (
              <XCircle size={20} color="white" />
            )}
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  permissionButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 12,
    borderRadius: 24,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  successBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  rescanButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rescanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  fullScreenLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loaderContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  fullScreenLoaderText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
  },
  fullScreenLoaderSubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    textAlign: "center",
  },
});
