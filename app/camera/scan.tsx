import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import { Text } from "@/components/AppText";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { X, CheckCircle, XCircle, MapPin } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useDispatch, useSelector, useStore } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import {
  scanQrCode,
  fetchUserBalances,
  setSelectedRestaurantBalance,
} from "@/store/slices/balanceSlice";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
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
    console.warn("Location not available:", error);
    throw error;
  }
};

const UUID_REGEX_GLOBAL =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function parsePaymentQrPayload(rawQr: string): {
  restaurantId: string | null;
  restaurantNameEn?: string;
} {
  const trimmed = rawQr.trim();
  const parts = trimmed.split("::");
  if (parts.length >= 3 && parts[0].toUpperCase() === "PAYMENT") {
    const restaurantId = parts[1]?.trim() ?? "";
    const restaurantNameEn = parts.slice(2).join("::").trim();
    if (UUID_REGEX_GLOBAL.test(restaurantId)) {
      return {
        restaurantId,
        restaurantNameEn: restaurantNameEn || undefined,
      };
    }
  }
  return {
    restaurantId: trimmed.match(UUID_REGEX_GLOBAL)?.[0] ?? null,
  };
}

/** Resolve restaurant UUID from scan API response and/or raw QR string. */
function extractRestaurantIdFromScanPayload(
  payload: unknown,
  rawQr: string,
): string | null {
  const fromRawPayload = parsePaymentQrPayload(rawQr);
  const fromQr = fromRawPayload.restaurantId;
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const d = p.data as Record<string, unknown> | string | undefined | null;
    if (typeof d === "string") {
      const m = d.match(UUID_REGEX_GLOBAL);
      if (m) return m[0];
    }
    if (d && typeof d === "object") {
      for (const key of ["restaurantId", "targetId", "id"] as const) {
        const v = d[key];
        if (typeof v === "string" && UUID_REGEX_GLOBAL.test(v)) return v;
      }
      const rest = d.restaurant as { id?: string } | undefined;
      if (rest?.id && UUID_REGEX_GLOBAL.test(rest.id)) return rest.id;
    }
    for (const key of ["restaurantId", "targetId", "id"] as const) {
      const v = p[key];
      if (typeof v === "string" && UUID_REGEX_GLOBAL.test(v)) return v;
    }
  }
  return fromQr;
}

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showLocationErrorModal, setShowLocationErrorModal] = useState(false);
  const { t } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.balance);
  const auth = useSelector((state: RootState) => state.auth);
  const { refreshBalances } = useBalance();
  const { showToast } = useAlert();
  const hasScanned = useRef(false);
  const store = useStore<RootState>();
  const params = useLocalSearchParams<{
    walletPay?: string;
    openPaymentModal?: string;
    openPaymentScreen?: string;
    paymentType?: "meal" | "drink";
  }>();
  const walletPayMode =
    params.walletPay === "1" || params.walletPay === "true";
  const openPaymentModalAfterScan =
    params.openPaymentModal === "1" ||
    params.openPaymentModal === "true" ||
    params.openPaymentScreen === "1" ||
    params.openPaymentScreen === "true";

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
      ]),
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
      ]),
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

  const UUID_REGEX =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  /** إذا كان الكود رابط قائمة → الدخول لعرض القائمة. وإلا → طلب الحصول على النقاط. */
  const isMenuLink = (raw: string) => /\/menu\//i.test(raw.trim());

  const parseMenuParams = (raw: string): { qrCode: string; table?: number } => {
    const trimmed = raw.trim();
    const uuidOnly =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        trimmed,
      );
    if (uuidOnly) return { qrCode: trimmed };
    try {
      const urlString = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://dummy.example${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
      const url = new URL(urlString);
      const pathMatch = url.pathname.match(/\/menu\/([0-9a-f-]{36})/i);
      const qrCode = pathMatch
        ? pathMatch[1]
        : (trimmed.match(UUID_REGEX)?.[0] ?? trimmed);
      const tableParam = url.searchParams.get("table");
      const table =
        tableParam != null && tableParam !== ""
          ? parseInt(tableParam, 10)
          : undefined;
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
      if (walletPayMode) {
        setIsProcessing(false);
        hasScanned.current = false;
        setIsScanning(true);
        setShowCamera(true);
        setScannedData(null);
        showToast({
          message: t("payment.scanMenuNotForWalletPay"),
          type: "error",
        });
        startScanAnimation();
        return;
      }
      const { qrCode, table } = parseMenuParams(data);
      const navParams: Record<string, string> = { qrCode: qrCode || data };
      if (table != null) navParams.table = String(table);
      setTimeout(() => {
        setIsProcessing(false);
        setShowCamera(false);
        hasScanned.current = false;
        router.push({
          pathname: "/(tabs)/menu-webview",
          params: navParams,
        } as any);
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

      // Wallet pay QR is parsed locally (restaurant id + english name),
      // no scanQrCode API call is needed here.
      if (walletPayMode) {
        const parsedPaymentQr = parsePaymentQrPayload(data);
        const rid = parsedPaymentQr.restaurantId;
        if (!rid) {
          showToast({
            message: t("payment.scanRestaurantInvalid"),
            type: "error",
          });
          setIsProcessing(false);
          setShowCamera(true);
          hasScanned.current = false;
          setIsScanning(true);
          setScannedData(null);
          startScanAnimation();
          return;
        }

        await dispatch(fetchUserBalances()).unwrap();
        const balances = store.getState().balance.userBalances;
        const item = balances.find(
          (b) => b.restaurantId === rid || b.restaurant?.id === rid || b.id === rid,
        );

        if (!item) {
          showToast({
            message: t("payment.scanRestaurantNotFound"),
            type: "error",
          });
          setIsProcessing(false);
          setShowCamera(true);
          hasScanned.current = false;
          setIsScanning(true);
          setScannedData(null);
          startScanAnimation();
          return;
        }

        const resolvedRestaurantId =
          item.restaurantId ?? item.restaurant?.id ?? item.id ?? rid;
        const rest = item.restaurant;
        dispatch(
          setSelectedRestaurant({
            id: resolvedRestaurantId,
            name: rest?.name ?? parsedPaymentQr.restaurantNameEn ?? t("home.restaurant"),
            address: rest?.address ?? "",
            logo: rest?.logo,
            userBalance: {
              walletBalance: item.balance ?? 0,
              mealPoints: item.stars_meal ?? 0,
              drinkPoints: item.stars_drink ?? 0,
            },
          }),
        );
        dispatch(setSelectedRestaurantBalance(resolvedRestaurantId));
        refreshBalances();

        showToast({
          message: t("camera.walletPayScanSuccess", {
            name: rest?.name ?? parsedPaymentQr.restaurantNameEn ?? "",
          }),
          type: "success",
        });
        setTimeout(() => {
          if (openPaymentModalAfterScan) {
            router.replace({
              pathname: "/payment",
              params: {
                paymentType: params.paymentType === "drink" ? "drink" : "meal",
                restaurantId: resolvedRestaurantId,
                restaurantName: rest?.name ?? parsedPaymentQr.restaurantNameEn ?? "",
              },
            } as never);
          } else {
            router.back();
          }
        }, 900);
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
        const scanPayload = await dispatch(
          scanQrCode({
            qrCode: data,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        ).unwrap();

        if (walletPayMode) {
          const rid = extractRestaurantIdFromScanPayload(scanPayload, data);
          const parsedPaymentQr = parsePaymentQrPayload(data);
          if (!rid) {
            showToast({
              message: t("payment.scanRestaurantInvalid"),
              type: "error",
            });
            setIsProcessing(false);
            setShowCamera(true);
            hasScanned.current = false;
            setIsScanning(true);
            setScannedData(null);
            startScanAnimation();
            return;
          }

          await dispatch(fetchUserBalances()).unwrap();
          const balances = store.getState().balance.userBalances;
          const item = balances.find(
            (b) =>
              b.restaurantId === rid ||
              b.restaurant?.id === rid ||
              b.id === rid,
          );

          if (!item) {
            showToast({
              message: t("payment.scanRestaurantNotFound"),
              type: "error",
            });
            setIsProcessing(false);
            setShowCamera(true);
            hasScanned.current = false;
            setIsScanning(true);
            setScannedData(null);
            startScanAnimation();
            return;
          }

          const resolvedRestaurantId =
            item.restaurantId ?? item.restaurant?.id ?? item.id ?? rid;

          const rest = item.restaurant;
          dispatch(
            setSelectedRestaurant({
              id: resolvedRestaurantId,
              name:
                rest?.name ??
                parsedPaymentQr.restaurantNameEn ??
                t("home.restaurant"),
              address: rest?.address ?? "",
              logo: rest?.logo,
              userBalance: {
                walletBalance: item.balance ?? 0,
                mealPoints: item.stars_meal ?? 0,
                drinkPoints: item.stars_drink ?? 0,
              },
            }),
          );
          dispatch(setSelectedRestaurantBalance(resolvedRestaurantId));
          refreshBalances();

          showToast({
            message: t("camera.walletPayScanSuccess", {
              name: rest?.name ?? "",
            }),
            type: "success",
          });
          setTimeout(() => {
            if (openPaymentModalAfterScan) {
              router.replace({
                pathname: "/payment",
                params: {
                  paymentType:
                    params.paymentType === "drink" ? "drink" : "meal",
                  restaurantId: resolvedRestaurantId,
                  restaurantName: rest?.name ?? parsedPaymentQr.restaurantNameEn ?? "",
                },
              } as never);
            } else {
              router.back();
            }
          }, 900);
          return;
        }

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

        const isLocationError =
          scanError?.response?.status === 403 ||
          (typeof scanError === "string" && scanError.includes("restaurant location")) ||
          scanError?.message?.includes("403") ||
          scanError?.message?.includes("You must be at the restaurant location");

        if (isLocationError) {
          setIsProcessing(false);
          setShowCamera(false);
          hasScanned.current = false;
          setIsScanning(false);
          setScannedData(null);
          setShowLocationErrorModal(true);
          return;
        }

        // إذا فشل الطلب، اعرض رسالة نجاح وهمية للتطوير
        if (
          __DEV__ &&
          !walletPayMode &&
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

      const isLocationError =
        (typeof error === "string" && error.includes("restaurant location")) ||
        error?.message?.includes("You must be at the restaurant location") ||
        error?.message?.includes("403");

      if (isLocationError) {
        setIsProcessing(false);
        setShowCamera(false);
        hasScanned.current = false;
        setIsScanning(false);
        setScannedData(null);
        setShowLocationErrorModal(true);
        return;
      }

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

            {walletPayMode ? (
              <View
                style={[
                  styles.walletPayBanner,
                  {
                    backgroundColor: "rgba(0,0,0,0.78)",
                    borderColor: "rgba(255,255,255,0.22)",
                  },
                ]}
              >
                <Text
                  style={[styles.walletPayBannerTitle, styles.walletPayBannerTextLight, font]}
                >
                  {t("camera.walletPayScannerTitle")}
                </Text>
                <Text
                  style={[
                    styles.walletPayBannerSubtitle,
                    styles.walletPayBannerTextLightMuted,
                    font,
                  ]}
                >
                  {t("camera.walletPayBannerSubtitle")}
                </Text>
              </View>
            ) : null}

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
                <Text
                  style={[
                    styles.instructionText,
                    walletPayMode ? styles.instructionTextOnCamera : null,
                  ]}
                >
                  {isScanning
                    ? walletPayMode
                      ? t("camera.walletPayPlaceCode")
                      : t("camera.placeCodeInFrame")
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

      {/* Location error modal: must be at restaurant — stop camera until user chooses retry or close */}
      <Modal
        visible={showLocationErrorModal}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {
          setShowLocationErrorModal(false);
          router.back();
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "#000000" }]}>
          <View style={[styles.errorModalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.errorModalIconWrap, { backgroundColor: colors.error + "20" }]}>
              <MapPin size={40} color={colors.error} />
            </View>
            <Text style={[styles.errorModalTitle, { color: colors.text }]}>
              {t("camera.scanLocationErrorTitle")}
            </Text>
            <Text style={[styles.errorModalMessage, { color: colors.textSecondary }]}>
              {t("camera.scanErrorForbidden")}
            </Text>
            <View style={styles.errorModalActions}>
              <TouchableOpacity
                style={[styles.errorModalButton, styles.errorModalButtonSecondary, { borderColor: colors.border }]}
                onPress={() => {
                  setShowLocationErrorModal(false);
                  setShowCamera(true);
                  setIsScanning(true);
                  setScannedData(null);
                  startScanAnimation();
                }}
              >
                <Text style={[styles.errorModalButtonTextSecondary, { color: colors.text }, font]}>
                  {t("camera.retryScan")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.errorModalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowLocationErrorModal(false);
                  router.back();
                }}
              >
                <Text style={[styles.errorModalButtonText, font]}>
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  walletPayBanner: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  walletPayBannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  walletPayBannerSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  /** Camera overlay: always light text (theme text is dark in light mode). */
  walletPayBannerTextLight: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  walletPayBannerTextLightMuted: {
    color: "rgba(255,255,255,0.92)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  /** Extra contrast on live camera (wallet hint under frame). */
  instructionTextOnCamera: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorModalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  errorModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  errorModalMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  errorModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  errorModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  errorModalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  errorModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorModalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
  },
});
