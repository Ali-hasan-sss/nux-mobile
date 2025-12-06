import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  Coffee,
  Star,
  UtensilsCrossed,
  Wallet,
  QrCode,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { useBalance } from "@/hooks/useBalance";
import { router, useFocusEffect } from "expo-router";
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
import { RestaurantQRCodes } from "@/components/RestaurantQRCodes";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
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

  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const isRestaurant = auth.user?.role === "RESTAURANT_OWNER";

  // Remove mock data initialization - let real data come from API

  // Fetch user balances every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (auth.isAuthenticated) {
        loadBalances();
      }
    }, [auth.isAuthenticated])
  );

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Fade out and hide after 8 seconds
    const fadeOutTimeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowWelcome(false);
      });
    }, 8000);

    return () => clearTimeout(fadeOutTimeout);
  }, []);

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
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: "transparent" }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: "transparent" },
        ]}
      >
        {showWelcome && !isRestaurant && (
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            <LinearGradient
              colors={
                isDark
                  ? (colors as any).gradientAccent || colors.gradient
                  : colors.gradient
              }
              style={styles.welcomeSection}
            >
              <Text style={styles.welcomeText}>{t("home.welcomeToNux")}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={styles.content}>
          {isRestaurant ? (
            <RestaurantQRCodes />
          ) : (
            <>
              <LinearGradient
                colors={
                  isDark
                    ? (colors as any).gradientButton || [
                        colors.primary,
                        colors.primary,
                      ]
                    : [colors.primary, colors.primary]
                }
                style={styles.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity
                  style={styles.primaryButtonInner}
                  onPress={handleScanCode}
                >
                  <Camera size={32} color="white" />
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.primaryButtonText}>
                      {t("home.scanCode")}
                    </Text>
                    <Text style={styles.primaryButtonDesc}>
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
              ) : restaurantsWithBalances.length > 0 ? (
                <RestaurantSelector
                  restaurants={restaurantsWithBalances}
                  onRestaurantChange={handleRestaurantChange}
                />
              ) : (
                <View
                  style={[
                    styles.noBalanceCard,
                    { backgroundColor: colors.surface },
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

              {/* Payment Buttons */}
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    {
                      backgroundColor: selectedRestaurant
                        ? colors.surface
                        : colors.surface + "50",
                      opacity: selectedRestaurant ? 1 : 0.5,
                    },
                  ]}
                  onPress={selectedRestaurant ? handlePayWithWallet : undefined}
                  disabled={!selectedRestaurant}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.success + "20" },
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
            </>
          )}
        </View>
      </ScrollView>

      {!isRestaurant && (
        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          initialPaymentType={selectedPaymentType}
          restaurantId={selectedRestaurant?.id}
        />
      )}
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
    paddingBottom: 100, // Extra space for tabs
    backgroundColor: "transparent",
  },
  welcomeSection: {
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 60,
    borderBottomRightRadius: 60,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: "hidden",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  content: {
    padding: 20,
    marginTop: 20,
    backgroundColor: "transparent",
  },
  primaryButton: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  buttonTextContainer: {
    marginLeft: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  primaryButtonDesc: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  paymentButtons: {
    gap: 16,
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
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
