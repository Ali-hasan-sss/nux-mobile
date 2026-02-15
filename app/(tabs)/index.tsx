import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import {
  Scan,
  Coffee,
  Star,
  UtensilsCrossed,
  Wallet,
  Search,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { useBalance } from "@/hooks/useBalance";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaymentModal } from "@/components/PaymentModal";
import {
  RestaurantSelector,
  Restaurant,
} from "@/components/RestaurantSelector";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
import {
  fetchUserBalances,
  setSelectedRestaurantBalance,
} from "@/store/slices/balanceSlice";

const TAB_BAR_HEIGHT = 88;

/** الشاشة الرئيسية - للتطبيق المخصص للعميل فقط (لا عرض لصاحب المطعم) */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + 12;
  const isRTL = i18n.language === "ar";
  const auth = useSelector((state: RootState) => state.auth);
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant,
  );
  const {
    restaurantsWithBalances,
    currentBalance,
    loadBalances,
    loading,
    error,
  } = useBalance();
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "drink" | "meal" | "wallet"
  >("wallet");

  useFocusEffect(
    React.useCallback(() => {
      if (!auth.isAuthenticated) return;
      loadBalances();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated]),
  );

  const handleScanCode = () => {
    router.push("/camera/scan");
  };

  const handlePayWithDrink = () => {
    setSelectedPaymentType("drink");
    setPaymentModalVisible(true);
  };

  const handlePayWithMeal = () => {
    setSelectedPaymentType("meal");
    setPaymentModalVisible(true);
  };

  const handlePayWithWallet = () => {
    setSelectedPaymentType("wallet");
    setPaymentModalVisible(true);
  };

  const handleRestaurantChange = (restaurant: Restaurant) => {
    // Convert to restaurantSlice format by ensuring userBalance is defined
    const restaurantForSlice = {
      ...restaurant,
      userBalance: restaurant.userBalance || {
        walletBalance: 0,
        drinkPoints: 0,
        mealPoints: 0,
      },
    };
    // Update selected restaurant
    dispatch(setSelectedRestaurant(restaurantForSlice));
    // Update selected restaurant balance
    dispatch(setSelectedRestaurantBalance(restaurant.id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: colors.background },
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
                    <Text style={styles.primaryButtonText} numberOfLines={1}>
                      {t("home.scanCode")}
                    </Text>
                    <Text style={styles.primaryButtonDesc} numberOfLines={2}>
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
                  <Text style={[styles.errorTitle, { color: colors.error }]}>
                    {t("home.errorLoadingData")}
                  </Text>
                  <Text
                    style={[styles.errorDesc, { color: colors.textSecondary }]}
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
                    <Text style={styles.retryButtonText}>
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
                      marginBottom: 24,
                    },
                  ]}
                >
                  <Text style={[styles.noBalanceTitle, { color: colors.text }]}>
                    {t("home.noBalances")}
                  </Text>
                  <Text
                    style={[
                      styles.noBalanceDesc,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("home.noBalancesDesc")}
                  </Text>
                </View>
              )}

              {/* Payment Buttons - same surface treatment in light and dark (no white box in light) */}
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    {
                      backgroundColor: selectedRestaurant
                        ? isDark
                          ? colors.surface
                          : colors.background
                        : isDark
                          ? colors.surface + "50"
                          : colors.background + "99",
                      opacity: selectedRestaurant ? 1 : 0.5,
                    },
                  ]}
                  onPress={selectedRestaurant ? handlePayWithWallet : undefined}
                  disabled={!selectedRestaurant}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isDark
                          ? colors.success + "20"
                          : colors.success + "15",
                      },
                    ]}
                  >
                    <View style={styles.balanceCol}>
                      <Wallet size={24} color={colors.success} />
                      <Text style={{ color: colors.success }}>
                        {currentBalance.walletBalance.toFixed(2)} $
                      </Text>
                    </View>
                    <View style={styles.balanceCol}>
                      <UtensilsCrossed size={24} color={colors.primary} />
                      <Text style={{ color: colors.success }}>
                        {currentBalance.mealPoints}{" "}
                        <Star size={16} color={colors.success} />
                      </Text>
                    </View>
                    <View style={styles.balanceCol}>
                      <Coffee size={24} color={colors.secondary} />
                      <Text style={{ color: colors.success }}>
                        {currentBalance.drinkPoints}{" "}
                        <Star size={16} color={colors.success} />
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.paymentButtonText,
                      {
                        color: selectedRestaurant
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedRestaurant
                      ? t("home.payWallet")
                      : t("home.selectRestaurantFirst")}
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
                <Text style={styles.exploreButtonText}>
                  {t("home.exploreRestaurants")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </>
        </View>
      </ScrollView>

      <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          initialPaymentType={selectedPaymentType}
          restaurantId={selectedRestaurant?.id}
      />

      {/* Floating scan button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.fabScan,
          {
            bottom: fabBottom,
            ...(isRTL ? { right: 20 } : { left: 20 }),
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={handleScanCode}
      >
        <Scan size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fabScan: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for tabs
    backgroundColor: "transparent",
  },
  content: {
    padding: 20,
    marginTop: 8,
    backgroundColor: "transparent",
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
    fontWeight: "bold",
    color: "white",
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
    fontWeight: "700",
    color: "#fff",
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
    display: "flex",
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  balanceCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  noBalanceTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  noBalanceDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
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
