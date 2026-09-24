import React, { useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  DeviceEventEmitter,
} from "react-native";
import { Text } from "@/components/AppText";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import {
  Scan,
  Coffee,
  Star,
  UtensilsCrossed,
  Search,
  Wallet,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { useBalance } from "@/hooks/useBalance";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTabBarHeight } from "@/constants/tabBarLayout";
import {
  RestaurantSelector,
  Restaurant,
} from "@/components/RestaurantSelector";
import {
  setSelectedRestaurant,
  type Restaurant as ReduxRestaurant,
} from "@/store/slices/restaurantSlice";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import {
  fetchWalletBalance,
  type WalletBalanceData,
} from "@/api/walletPaymentApi";
import { LoyaltyPointsBurst } from "@/components/LoyaltyPointsBurst";
import {
  consumePendingLoyaltyPointsEarned,
  type LoyaltyPointsKind,
} from "@/lib/loyaltyPointsEvents";

/** الشاشة الرئيسية - للتطبيق المخصص للعميل فقط (لا عرض لصاحب المطعم) */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";
  const auth = useSelector((state: RootState) => state.auth);
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant,
  );
  const {
    restaurantsWithBalances,
    userBalances,
    currentBalance,
    loadBalances,
    loading,
    error,
  } = useBalance();
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "drink" | "meal"
  >("meal");
  const [globalWallet, setGlobalWallet] = useState<WalletBalanceData | null>(
    null,
  );
  const [displayMeal, setDisplayMeal] = useState<number | null>(null);
  const [displayDrink, setDisplayDrink] = useState<number | null>(null);
  const [pointsBurst, setPointsBurst] = useState<{
    kind: LoyaltyPointsKind;
    targetX: number;
    targetY: number;
  } | null>(null);
  const rootRef = useRef<View>(null);
  const mealCellRef = useRef<View>(null);
  const drinkCellRef = useRef<View>(null);
  const mealScale = useRef(new Animated.Value(1)).current;
  const drinkScale = useRef(new Animated.Value(1)).current;
  const countFrameRef = useRef<number | null>(null);
  const countGenerationRef = useRef(0);

  const shownMeal = displayMeal ?? currentBalance.mealPoints;
  const shownDrink = displayDrink ?? currentBalance.drinkPoints;

  const pulseCell = (kind: LoyaltyPointsKind) => {
    const scale = kind === "drink" ? drinkScale : mealScale;
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.18,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCount = (
    kind: LoyaltyPointsKind,
    from: number,
    to: number,
  ) => {
    if (countFrameRef.current != null) {
      cancelAnimationFrame(countFrameRef.current);
      countFrameRef.current = null;
    }
    const generation = ++countGenerationRef.current;
    const setter = kind === "drink" ? setDisplayDrink : setDisplayMeal;
    setter(from);
    const start = Date.now();
    const duration = 520;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setter(Math.round(from + (to - from) * eased));
      if (t < 1) {
        countFrameRef.current = requestAnimationFrame(step);
      } else {
        countFrameRef.current = null;
        setter(to);
        setTimeout(() => {
          if (countGenerationRef.current === generation) {
            setter(null);
          }
        }, 450);
      }
    };
    countFrameRef.current = requestAnimationFrame(step);
  };

  const startPointsBurst = React.useCallback(
    (kind: LoyaltyPointsKind, fromPoints: number, delta: number) => {
      const cellRef = kind === "drink" ? drinkCellRef : mealCellRef;
      const runMeasure = () => {
        rootRef.current?.measureInWindow((ox, oy) => {
          cellRef.current?.measureInWindow((x, y, w, h) => {
            if (!w && !h) return;
            setPointsBurst({
              kind,
              targetX: x + w / 2 - ox,
              targetY: y + h / 2 - oy,
            });
            setTimeout(() => {
              pulseCell(kind);
              animateCount(kind, fromPoints, fromPoints + delta);
            }, 420);
          });
        });
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(runMeasure, 60);
        });
      });
    },
    [drinkScale, mealScale],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!auth.isAuthenticated) {
        setGlobalWallet(null);
        return;
      }
      loadBalances();
      fetchWalletBalance()
        .then(setGlobalWallet)
        .catch(() => setGlobalWallet(null));

      const pending = consumePendingLoyaltyPointsEarned();
      if (pending) {
        if (pending.restaurantId) {
          dispatch(setSelectedRestaurantBalance(pending.restaurantId));
        }
        const kind = pending.type === "drink" ? "drink" : "meal";
        const delta = pending.delta ?? 1;
        const fromPoints =
          pending.fromPoints ??
          Math.max(
            0,
            (kind === "drink"
              ? currentBalance.drinkPoints
              : currentBalance.mealPoints) - delta,
          );
        if (kind === "drink") {
          setDisplayDrink(fromPoints);
        } else {
          setDisplayMeal(fromPoints);
        }
        startPointsBurst(kind, fromPoints, delta);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated, startPointsBurst]),
  );

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener("wallet:balanceChanged", () => {
      fetchWalletBalance()
        .then(setGlobalWallet)
        .catch(() => setGlobalWallet(null));
    });
    return () => {
      sub.remove();
    };
  }, []);

  const hasLoyaltyPointsAnywhere = userBalances.some(
    (b) =>
      (Number(b.stars_meal) || 0) > 0 || (Number(b.stars_drink) || 0) > 0,
  );
  const hasLoyaltyAtSelected =
    !!selectedRestaurant &&
    (currentBalance.mealPoints > 0 || currentBalance.drinkPoints > 0);
  const hasGlobalWalletFunds =
    !!globalWallet && Number(globalWallet.balance) > 0;
  const canPay =
    auth.isAuthenticated &&
    (hasLoyaltyPointsAnywhere || hasGlobalWalletFunds);

  const payButtonLabel = !auth.isAuthenticated
    ? t("home.selectRestaurantFirst")
    : !canPay
      ? t("home.noBalanceToPay")
      : !selectedRestaurant
        ? t("home.payPickRestaurantNext")
        : !hasLoyaltyAtSelected && hasGlobalWalletFunds
          ? t("wallet.payWithAppWallet")
          : hasLoyaltyAtSelected && !hasGlobalWalletFunds
            ? t("home.payWithLoyaltyPoints")
            : t("home.payWithWalletOrPoints");

  const handleScanCode = () => {
    router.push("/camera/scan");
  };

  const handlePayWithDrink = () => {
    setSelectedPaymentType("drink");
    router.push({
      pathname: "/camera/scan",
      params: {
        walletPay: "1",
        openPaymentScreen: "1",
        paymentType: "drink",
      },
    } as never);
  };

  const handlePayWithMeal = () => {
    setSelectedPaymentType("meal");
    router.push({
      pathname: "/camera/scan",
      params: {
        walletPay: "1",
        openPaymentScreen: "1",
        paymentType: "meal",
      },
    } as never);
  };

  /** Open payment modal (voucher only: meal or drink). Default meal. */
  const handlePay = () => {
    router.push({
      pathname: "/camera/scan",
      params: {
        walletPay: "1",
        openPaymentScreen: "1",
        paymentType: "meal",
      },
    } as never);
  };

  const handleRestaurantChange = (restaurant: Restaurant) => {
    const restaurantForSlice: ReduxRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address ?? "",
      logo: restaurant.logo,
      userBalance:
        restaurant.userBalance ?? {
          walletBalance: 0,
          drinkPoints: 0,
          mealPoints: 0,
        },
    };
    dispatch(setSelectedRestaurant(restaurantForSlice));
    // Update selected restaurant balance
    dispatch(setSelectedRestaurantBalance(restaurant.id));
  };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={{ flex: 1, backgroundColor: "transparent" }}
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: "transparent" }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            backgroundColor: "transparent",
            paddingBottom: getTabBarHeight(insets.bottom) + 80,
          },
        ]}
      >
        <View style={styles.content}>
          <>
            <LinearGradient
                colors={
                  (colors as any).gradientButton || [
                    colors.primary,
                    colors.primary,
                  ]
                }
                style={styles.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity
                  style={styles.primaryButtonInner}
                  onPress={handleScanCode}
                  activeOpacity={0.85}
                >
                  <Scan
                    size={28}
                    color="white"
                    style={styles.primaryButtonIcon}
                  />
                  <View style={styles.buttonTextContainer}>
                    <Text style={[styles.primaryButtonText, font]} numberOfLines={1}>
                      {t("home.scanCode")}
                    </Text>
                    <Text style={[styles.primaryButtonDesc, font]} numberOfLines={2}>
                      {t("home.scanCodeDesc")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              {/* Error/Balance Cards */}
              {error.balances ? (
                <View
                  style={[
                    styles.errorCard,
                    {
                      backgroundColor: colors.error + "20",
                      borderColor: colors.error,
                    },
                  ]}
                >
                  <Text style={[styles.errorTitle, { color: colors.error }, font]}>
                    {t("home.errorLoadingData")}
                  </Text>
                  <Text
                    style={[styles.errorDesc, { color: colors.textSecondary }, font]}
                  >
                    {error.balances}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.retryButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={loadBalances}
                  >
                    <Text style={[styles.retryButtonText, font]}>
                      {t("home.retry")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : loading?.balances ? (
                <View
                  style={[
                    styles.selectorSkeleton,
                    {
                      backgroundColor: isDark ? colors.surface : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.selectorSkeletonLogo,
                      { backgroundColor: colors.border + "50" },
                    ]}
                  />
                  <View style={styles.selectorSkeletonContent}>
                    <View
                      style={[
                        styles.selectorSkeletonLine,
                        styles.selectorSkeletonLabel,
                        { backgroundColor: colors.border + "50" },
                      ]}
                    />
                    <View
                      style={[
                        styles.selectorSkeletonLine,
                        styles.selectorSkeletonText,
                        { backgroundColor: colors.border + "40" },
                      ]}
                    />
                  </View>
                </View>
              ) : restaurantsWithBalances.length > 0 ? (
                <RestaurantSelector
                  restaurants={restaurantsWithBalances}
                  onRestaurantChange={handleRestaurantChange}
                />
              ) : (
                <View
                  style={[
                    styles.noBalanceCard,
                    {
                      backgroundColor: isDark ? colors.surface : "transparent",
                      marginBottom: 12,
                    },
                  ]}
                >
                  <Text style={[styles.noBalanceTitle, { color: colors.text }, font]}>
                    {t("home.noBalances")}
                  </Text>
                </View>
              )}

              {/* Payment Buttons - same surface treatment in light and dark (no white box in light) */}
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    {
                      backgroundColor: canPay
                        ? isDark
                          ? colors.surface
                          : colors.background
                        : isDark
                          ? colors.surface + "50"
                          : colors.background + "99",
                      opacity: canPay ? 1 : 0.5,
                    },
                  ]}
                  onPress={canPay ? handlePay : undefined}
                  disabled={!canPay}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        flexDirection: isRTL ? "row-reverse" : "row",
                        backgroundColor: isDark
                          ? colors.success + "20"
                          : colors.success + "15",
                      },
                    ]}
                  >
                    <View
                      ref={mealCellRef}
                      collapsable={false}
                      style={styles.payBalanceCell}
                    >
                      <Animated.View
                        style={[
                          styles.payBalanceCellInner,
                          { transform: [{ scale: mealScale }] },
                        ]}
                      >
                        <UtensilsCrossed size={18} color={colors.primary} />
                        <Text
                          style={[
                            styles.payBalanceValue,
                            { color: colors.success },
                            font,
                          ]}
                          numberOfLines={1}
                        >
                          {shownMeal}
                        </Text>
                        <Star size={14} color={colors.success} />
                      </Animated.View>
                    </View>
                    <View
                      ref={drinkCellRef}
                      collapsable={false}
                      style={styles.payBalanceCell}
                    >
                      <Animated.View
                        style={[
                          styles.payBalanceCellInner,
                          { transform: [{ scale: drinkScale }] },
                        ]}
                      >
                        <Coffee size={18} color={colors.secondary} />
                        <Text
                          style={[
                            styles.payBalanceValue,
                            { color: colors.success },
                            font,
                          ]}
                          numberOfLines={1}
                        >
                          {shownDrink}
                        </Text>
                        <Star size={14} color={colors.success} />
                      </Animated.View>
                    </View>
                    {auth.isAuthenticated &&
                    hasGlobalWalletFunds &&
                    globalWallet ? (
                      <>
                        <View
                          style={[
                            styles.payBalanceDivider,
                            { backgroundColor: colors.border },
                          ]}
                        />
                        <View style={styles.payBalanceCell}>
                          <Wallet size={18} color={colors.primary} />
                          <Text
                            style={[
                              styles.payBalanceValue,
                              { color: colors.success, fontSize: 13 },
                              font,
                            ]}
                            numberOfLines={1}
                          >
                            {Number(globalWallet.balance).toLocaleString(
                              i18n.language === "ar"
                                ? "ar-EG"
                                : i18n.language === "de"
                                  ? "de-DE"
                                  : "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            {globalWallet.currency}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.paymentButtonText,
                      {
                        color: canPay ? colors.text : colors.textSecondary,
                      },
                      font,
                    ]}
                  >
                    {payButtonLabel}
                  </Text>
                </TouchableOpacity>
              </View>

            {/* Explore restaurants - below payment */}
            <LinearGradient
              colors={
                (colors as any).gradientButton || [
                  colors.primary,
                  colors.primary,
                ]
              }
              style={[styles.exploreButton, styles.exploreButtonGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.exploreButtonInner}
                onPress={() => router.push("/(tabs)/explore-restaurants")}
                activeOpacity={0.85}
              >
                <Search size={22} color="#fff" style={styles.exploreButtonIcon} />
                <Text style={[styles.exploreButtonText, font]}>
                  {t("home.exploreRestaurants")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </>
        </View>
      </ScrollView>
      {pointsBurst ? (
        <View pointerEvents="none" style={styles.pointsBurstLayer}>
          <LoyaltyPointsBurst
            targetX={pointsBurst.targetX}
            targetY={pointsBurst.targetY}
            color="#F5C542"
            onDone={() => setPointsBurst(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  content: {
    padding: 20,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  pointsBurstLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    elevation: 80,
  },
  primaryButton: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 2,
    overflow: "hidden",
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    minHeight: 56,
  },
  primaryButtonIcon: {
    flexShrink: 0,
  },
  buttonTextContainer: {
    marginLeft: 14,
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 17,
    color: "white",
    // no fontWeight: avoids overriding custom font (Cairo/Poppins) on Android
  },
  primaryButtonDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  paymentButtons: {
    gap: 16,
  },
  selectorSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectorSkeletonLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  selectorSkeletonContent: {
    flex: 1,
    minWidth: 0,
  },
  selectorSkeletonLine: {
    borderRadius: 4,
  },
  selectorSkeletonLabel: {
    height: 12,
    width: 72,
    marginBottom: 8,
  },
  selectorSkeletonText: {
    height: 16,
    width: "60%",
  },
  exploreButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonGradient: {},
  exploreButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  exploreButtonIcon: {},
  exploreButtonText: {
    fontSize: 16,
    color: "#fff",
    // no fontWeight: avoids overriding custom font (Cairo/Poppins) on Android
  },
  paymentButton: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "space-evenly",
    marginBottom: 12,
  },
  payBalanceCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  payBalanceCellInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  payBalanceValue: {
    fontSize: 14,
  },
  payBalanceDivider: {
    width: StyleSheet.hairlineWidth * 2,
    alignSelf: "stretch",
    minHeight: 22,
    marginHorizontal: 4,
    opacity: 0.85,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    alignSelf: "center",
  },
  paymentButtonDesc: {
    fontSize: 14,
  },
  restaurantSection: {
    marginBottom: 24,
  },
  restaurantTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  qrCodesContainer: {
    gap: 20,
  },
  qrCodeCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  noBalanceCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  noBalanceTitle: {
    fontSize: 13,
    textAlign: "center",
  },
  errorCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
