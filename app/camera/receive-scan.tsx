import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Text } from "@/components/AppText";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { X, CheckCircle, XCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function ReceiveScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanned, setScanned] = useState(false);
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

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

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

    // إخفاء الكاميرا فوراً وإظهار الـ loader
    setShowCamera(false);
    setIsProcessing(true);

    try {

      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast("success", "تم استلام الرصيد بنجاح!");

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (e) {
      showToast("error", "حدث خطأ أثناء استلام الرصيد");
      setIsProcessing(false);
      setShowCamera(true);
      setScanned(false);
    }
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
              جاري استلام الرصيد...
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
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => router.back()}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame} />
              <Text style={styles.instructionText}>
                Scan your friend's QR code to receive balance
              </Text>
            </View>
          </View>
        </CameraView>
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
