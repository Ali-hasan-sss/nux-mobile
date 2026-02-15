import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { X, CheckCircle, XCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { scanQrCode } from "@/store/slices/balanceSlice";
import { useBalance } from "@/hooks/useBalance";
import { useAlert } from "@/contexts/AlertContext";
// Fallback location if expo-location is not available
const getCurrentLocation = async () => {
  try {
    // Try to use expo-location
    const Location = await import("expo-location");

    // Check if the module has the required functions
    if (
      Location &&
      typeof Location.getForegroundPermissionsAsync === "function"
    ) {
      // Check if permission is already granted
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        // Request permission if not granted
        if (typeof Location.requestForegroundPermissionsAsync === "function") {
          const { status: newStatus } =
            await Location.requestForegroundPermissionsAsync();
          if (newStatus !== "granted") {
            throw new Error("Location permission denied");
          }
        } else {
          throw new Error("Location permission request not available");
        }
      }

      if (typeof Location.getCurrentPositionAsync === "function") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy?.High || 6,
        });
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } else {
        throw new Error("getCurrentPositionAsync not available");
      }
    } else {
      throw new Error("expo-location module not properly loaded");
    }
  } catch (error) {
    console.warn("Location not available, using fallback coordinates:", error);
    // For development, use coordinates that might be closer to a restaurant
    // You can change these to coordinates near your test restaurant
    return {
      latitude: 36.020214,
      longitude: 35.0134549,
    };
  }
};

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.balance);
  const auth = useSelector((state: RootState) => state.auth);
  const { refreshBalances } = useBalance();
  const { showToast, showAlert } = useAlert();
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
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scanFrameScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const cornerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerScale, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(cornerScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    frameAnimation.start();
    cornerAnimation.start();

    return { frameAnimation, cornerAnimation };
  };

  const stopScanAnimation = () => {
    scanFrameScale.stopAnimation();
    scanFrameScale.setValue(1);
    cornerScale.stopAnimation();
    cornerScale.setValue(1);
  };

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Request location permission when component mounts
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const Location = await import("expo-location");

        // permission  foreground
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationPermission(false);
          return;
        }

        setLocationPermission(true);
      } catch (error) {
        console.warn("Location permission request failed:", error);
        setLocationPermission(false);
      }
    };

    requestLocationPermission();
  }, []);

  // إعادة تعيين حالة المسح عند فتح الشاشة
  useEffect(() => {
    hasScanned.current = false;
    setIsScanning(true);
    setScannedData(null);

    // بدء انيميشن المسح
    const animations = startScanAnimation();

    return () => {
      animations.frameAnimation.stop();
      animations.cornerAnimation.stop();
    };
  }, []);

  const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  /** إذا كان الكود رابط قائمة → الدخول لعرض القائمة. وإلا → طلب الحصول على النقاط. */
  const isMenuLink = (raw: string) => /\/menu\//i.test(raw.trim());

  const parseMenuParams = (raw: string): { qrCode: string; table?: number } => {
    const trimmed = raw.trim();
    const uuidOnly = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    if (uuidOnly) return { qrCode: trimmed };
    try {
      const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://dummy.example${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
      const url = new URL(urlString);
      const pathMatch = url.pathname.match(/\/menu\/([0-9a-f-]{36})/i);
      const qrCode = pathMatch ? pathMatch[1] : trimmed.match(UUID_REGEX)?.[0] ?? trimmed;
      const tableParam = url.searchParams.get("table");
      const table = tableParam != null && tableParam !== "" ? parseInt(tableParam, 10) : undefined;
      const tableValid = table != null && !isNaN(table) && table > 0;
      return { qrCode, table: tableValid ? table : undefined };
    } catch {
      return { qrCode: trimmed.match(UUID_REGEX)?.[0] ?? trimmed };
    }
  };

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

    // إذا كان الرابط رابط قائمة → الدخول لعرض القائمة (بدون طلب نقاط)
    if (isMenuLink(data)) {
      const { qrCode, table } = parseMenuParams(data);
      const navParams: Record<string, string> = { qrCode: qrCode || data };
      if (table != null) navParams.table = String(table);
      setTimeout(() => {
        setIsProcessing(false);
        setShowCamera(false);
        hasScanned.current = false;
        router.push({ pathname: "/(tabs)/menu-webview", params: navParams } as any);
      }, 300);
      return;
    }

    try {
      // التحقق من حالة المصادقة
      if (!auth.isAuthenticated) {
        showToast({ message: t("camera.scanMustLogin"), type: "error" });
        setIsProcessing(false);
        setShowCamera(true);
        setTimeout(() => router.back(), 2000);
        return;
      }

      // الحصول على الموقع الحالي
      const location = await getCurrentLocation();

      // تحقق من أن الموقع صالح
      if (
        !location ||
        (location.latitude === 36.020214 && location.longitude === 35.0134549)
      ) {
        console.warn("Using fallback location, might cause 403 error");
        // في وضع التطوير، يمكن تجاوز فحص الموقع
        if (__DEV__) {
          console.log("🔄 Development mode: Using fallback location");
        }
      }

      console.log("🔍 Scanning QR with data:", {
        qrCode: data,
        latitude: location.latitude,
        longitude: location.longitude,
        isAuthenticated: auth.isAuthenticated,
      });

      // إرسال طلب مسح الكود
      try {
        await dispatch(
          scanQrCode({
            qrCode: data,
            latitude: location.latitude,
            longitude: location.longitude,
          })
        ).unwrap();

        // نجح المسح - إظهار Toast النجاح وتحديث الرصيد
        showToast({
          message: t("camera.scanSuccess"),
          type: "success",
        });

        // تحديث الرصيد بعد نجاح المسح
        refreshBalances();

        // إغلاق المودال بعد 2 ثانية
        setTimeout(() => {
          router.back();
        }, 2000);
      } catch (scanError: any) {
        console.log("🔍 Scan error caught:", scanError);

        // Handle specific error cases
        if (
          scanError.response?.status === 403 ||
          scanError.message?.includes("403") ||
          scanError.message?.includes("You must be at the restaurant location")
        ) {
          // For development, show a bypass option
          if (__DEV__) {
            showAlert({
              title: t("camera.scanLocationErrorTitle"),
              message: t("camera.scanLocationErrorMessage"),
              type: "warning",
              confirmText: t("camera.scanBypassForDev"),
              cancelText: t("camera.cancel"),
              onConfirm: () => {
                showToast({
                  message: t("camera.scanSuccessDev"),
                  type: "success",
                });
                // تحديث الرصيد بعد نجاح المسح
                refreshBalances();
                setTimeout(() => {
                  router.back();
                }, 2000);
              },
              onCancel: () => {
                setIsProcessing(false);
                setShowCamera(true);
                hasScanned.current = false;
                setIsScanning(true);
                setScannedData(null);

                // بدء انيميشن المسح مرة أخرى
                startScanAnimation();
              },
            });
          } else {
            showToast({
              message: t("camera.scanErrorForbidden"),
              type: "error",
            });
            setIsProcessing(false);
            setShowCamera(true);
            hasScanned.current = false;
            setIsScanning(true);
            setScannedData(null);

            // بدء انيميشن المسح مرة أخرى
            startScanAnimation();
          }
          return;
        }

        // إذا فشل الطلب، اعرض رسالة نجاح وهمية للتطوير
        if (
          __DEV__ &&
          (scanError.message?.includes("Network Error") ||
            scanError.code === "NETWORK_ERROR")
        ) {
          console.log("🔄 Using fallback success for development");
          showToast({
            message: t("camera.scanSuccessDev"),
            type: "success",
          });
          // تحديث الرصيد بعد نجاح المسح
          refreshBalances();
          setTimeout(() => {
            router.back();
          }, 2000);
          return; // Exit early to prevent the outer catch from running
        } else {
          // إعادة رمي الخطأ للمعالجة في catch الخارجي
          throw scanError;
        }
      }
    } catch (error: any) {
      console.error("خطأ في مسح الكود:", error);

      let errorMessage = t("camera.scanErrorGeneric");
      if (error.message?.includes("Network Error")) {
        errorMessage = t("camera.scanErrorNetwork");
      } else if (error.message?.includes("401")) {
        errorMessage = t("camera.scanErrorUnauthorized");
      } else if (error.message?.includes("403")) {
        errorMessage = t("camera.scanErrorForbidden");
      } else if (error.message?.includes("Location permission denied")) {
        errorMessage = t("camera.scanErrorLocationRequired");
      }

      showToast({ message: errorMessage, type: "error" });
      setIsProcessing(false);
      setShowCamera(true);
      hasScanned.current = false;
      setIsScanning(true);
      setScannedData(null);

      // بدء انيميشن المسح مرة أخرى
      startScanAnimation();
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          {t("camera.cameraPermissionRequired")}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>
            {t("camera.grantPermission")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>
          {t("camera.locationPermissionRequired")}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            try {
              const Location = await import("expo-location");
              if (
                Location &&
                typeof Location.requestForegroundPermissionsAsync === "function"
              ) {
                const { status } =
                  await Location.requestForegroundPermissionsAsync();
                setLocationPermission(status === "granted");
              } else {
                console.warn("Location permissions not available");
                setLocationPermission(false);
              }
            } catch (error) {
              console.warn("Location permission request failed:", error);
              setLocationPermission(false);
            }
          }}
        >
          <Text style={styles.permissionButtonText}>
            {t("camera.grantLocationPermission")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.permissionButton,
            { backgroundColor: colors.error, marginTop: 10 },
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>{t("camera.cancel")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Loader Screen - سبينر فقط أثناء المعالجة */}
      {!showCamera && isProcessing && (
        <View
          style={[
            styles.fullScreenLoader,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Camera View - يظهر فقط عندما showCamera === true */}
      {showCamera && (
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
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
                <Animated.View
                  style={[
                    styles.corner,
                    styles.topLeft,
                    {
                      transform: [{ scale: cornerScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.corner,
                    styles.topRight,
                    {
                      transform: [{ scale: cornerScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.corner,
                    styles.bottomLeft,
                    {
                      transform: [{ scale: cornerScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.corner,
                    styles.bottomRight,
                    {
                      transform: [{ scale: cornerScale }],
                    },
                  ]}
                />
              </Animated.View>
              {!isProcessing && (
                <Text style={styles.instructionText}>
                  {isScanning
                    ? t("camera.placeCodeInFrame")
                    : scannedData
                    ? t("camera.scanSuccess")
                    : t("camera.tapToRetry")}
                </Text>
              )}

              {/* Loader - سبينر فقط بدون نص */}
              {isProcessing && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}

              {!isScanning && !isProcessing && (
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    hasScanned.current = false;
                    setIsScanning(true);
                    setScannedData(null);
                    setShowCamera(true);
                    startScanAnimation();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t("camera.retryScan")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
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
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "white",
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderTopLeftRadius: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderTopRightRadius: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomLeftRadius: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderBottomRightRadius: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    alignItems: "center",
    marginTop: 20,
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
});
