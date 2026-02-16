import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { Text } from "@/components/AppText";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * استخلاص معرف المطعم (qrCode) ورقم الطاولة من بيانات المسح.
 * الرابط قد يكون: https://www.nuxapp.de/menu/uuid?table=5 أو uuid فقط.
 * رقم الطاولة متاح حصراً من الرابط (مسح كود الطاولة).
 */
function parseMenuScanData(
  data: string
): { qrCode: string; table?: number } {
  const trimmed = data.trim();
  if (!trimmed) return { qrCode: trimmed };

  const uuidOnly =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed
    );
  if (uuidOnly) return { qrCode: trimmed };

  try {
    let urlString = trimmed;
    if (!/^https?:\/\//i.test(trimmed)) urlString = `https://dummy.example${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
    const url = new URL(urlString);
    const pathMatch = url.pathname.match(/\/menu\/([0-9a-f-]{36})/i);
    const qrCode = pathMatch ? pathMatch[1] : trimmed.match(UUID_REGEX)?.[0] ?? trimmed;
    const tableParam = url.searchParams.get("table");
    const table =
      tableParam != null && tableParam !== ""
        ? parseInt(tableParam, 10)
        : undefined;
    const tableValid = table != null && !isNaN(table) && table > 0;
    return { qrCode, table: tableValid ? table : undefined };
  } catch {
    const fallbackUuid = trimmed.match(UUID_REGEX)?.[0];
    return { qrCode: fallbackUuid ?? trimmed };
  }
}

export default function MenuScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [isFocused, setIsFocused] = useState(true); // Track if screen is focused
  const { t } = useTranslation();
  const { colors } = useTheme();
  const hasScanned = useRef(false);

  // Animation values
  const scanFrameScale = useRef(new Animated.Value(1)).current;
  const scanFrameOpacity = useRef(new Animated.Value(0.8)).current;
  const cornerScale = useRef(new Animated.Value(1)).current;

  // Scan frame animation
  const startScanAnimation = () => {
    const frameAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanFrameScale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanFrameScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanFrameOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanFrameOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    frameAnimation.start();
    opacityAnimation.start();
  };

  const stopScanAnimation = () => {
    scanFrameScale.stopAnimation();
    scanFrameOpacity.stopAnimation();
    cornerScale.stopAnimation();
  };

  useEffect(() => {
    if (isScanning && showCamera) {
      startScanAnimation();
    }
    return () => {
      stopScanAnimation();
    };
  }, [isScanning, showCamera]);

  // Reset processing state when screen loses focus (user navigates away)
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - enable camera
      setIsFocused(true);
      setIsProcessing(false);
      setShowCamera(true);
      setIsScanning(true);
      hasScanned.current = false;

      return () => {
        // Cleanup: Reset processing state when screen loses focus
        setIsFocused(false); // Mark screen as unfocused
        setIsProcessing(false);
        setShowCamera(false); // Hide camera when screen loses focus
        setIsScanning(false);
        hasScanned.current = false;
        stopScanAnimation();
      };
    }, [])
  );

  // Also reset state on component unmount
  useEffect(() => {
    return () => {
      setIsFocused(false);
      setIsProcessing(false);
      setShowCamera(false);
      setIsScanning(false);
      hasScanned.current = false;
      stopScanAnimation();
    };
  }, []);

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    // منع المسح المتكرر
    if (hasScanned.current || !isScanning || isProcessing) {
      return;
    }

    hasScanned.current = true;
    setIsScanning(false);
    setScannedData(data);

    // إخفاء الكاميرا فوراً وإظهار الـ loader
    setShowCamera(false);
    setIsProcessing(true);

    // إيقاف انيميشن المسح
    stopScanAnimation();

    try {
      // التحقق من أن البيانات صالحة (يجب أن يكون QR Code هو معرف المطعم)
      if (!data || data.trim() === "") {
        setIsProcessing(false);
        setShowCamera(true);
        hasScanned.current = false;
        return;
      }

      // استخلاص معرف المطعم ورقم الطاولة من الرابط (إن وُجد)
      const { qrCode: extractedQr, table } = parseMenuScanData(data);

      setTimeout(() => {
        setIsProcessing(false);
        setShowCamera(false);
        setIsScanning(false);
        hasScanned.current = false;
        stopScanAnimation();

        const navParams: Record<string, string> = { qrCode: extractedQr || data };
        if (table != null) navParams.table = String(table);

        router.push({
          pathname: "/(tabs)/menu-webview",
          params: navParams,
        } as any);
      }, 500);
    } catch (error) {
      console.error("Error processing menu QR code:", error);
      setIsProcessing(false);
      setShowCamera(true);
      hasScanned.current = false;
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: colors.text }]}>
            {t("camera.requestingPermission")}
          </Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.text, { color: colors.text }]}>
            {t("camera.cameraPermissionRequired")}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>{t("camera.grantPermission")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Don't render camera if screen is not focused - return empty view
  if (!isFocused) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showCamera && isFocused ? (
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={
            isScanning && !isProcessing && isFocused
              ? handleBarCodeScanned
              : undefined
          }
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  // Clean up camera state before navigating back
                  setIsFocused(false);
                  setShowCamera(false);
                  setIsScanning(false);
                  setIsProcessing(false);
                  hasScanned.current = false;
                  stopScanAnimation();
                  router.back();
                }}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("home.scanMenuCode")}</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Scan Frame */}
            <View style={styles.scanFrameContainer}>
              <Animated.View
                style={[
                  styles.scanFrame,
                  {
                    transform: [{ scale: scanFrameScale }],
                    opacity: scanFrameOpacity,
                  },
                ]}
              >
                {/* Corner indicators */}
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </Animated.View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {t("camera.scanMenuQRCode")}
              </Text>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.text }]}>
            {t("camera.processing")}...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00D9FF",
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00D9FF",
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#00D9FF",
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#00D9FF",
    borderBottomRightRadius: 20,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: "center",
  },
  instructionsText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
