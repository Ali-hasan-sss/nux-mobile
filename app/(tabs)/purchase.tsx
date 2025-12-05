import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useBalance } from "@/hooks/useBalance";
import { useProfile } from "@/hooks/useProfile";
import { useFocusEffect } from "expo-router";
import {
  CreditCard,
  Gift,
  Camera,
  Coffee,
  UtensilsCrossed,
  Wallet,
  Clock,
  Star,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import {
  RestaurantSelector,
  Restaurant,
} from "@/components/RestaurantSelector";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import GiftModal from "@/components/GiftModal";
import PackagesModal from "@/components/PackagesModal";
import { RestaurantActivityTabs } from "@/components/RestaurantActivityTabs";

export default function PurchaseScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors, isDark } = useTheme();
  const auth = useSelector((state: RootState) => state.auth);
  const { profile, fetchProfile } = useProfile();
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
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [packagesModalVisible, setPackagesModalVisible] = useState(false);
  const [modalManuallyClosed, setModalManuallyClosed] = useState(false);
  const profileFetched = useRef(false);

  const isRestaurant = auth.user?.role === "RESTAURANT_OWNER";

  // Fetch user balances and profile every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (auth.isAuthenticated) {
        loadBalances();

        // Fetch profile only once if not already loaded
        if (!profileFetched.current && !profile) {
          fetchProfile();
          profileFetched.current = true;
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated])
  );

  const handleRecharge = () => {
    if (!selectedRestaurant) {
      Alert.alert(t("common.error"), "Please select a restaurant first");
      return;
    }
    // فتح مودال باقات الشحن
    setPackagesModalVisible(true);
  };

  const handleGiftFriend = () => {
    if (!selectedRestaurant) {
      Alert.alert(t("common.error"), "Please select a restaurant first");
      return;
    }
    // Reset manual close flag and open modal
    setModalManuallyClosed(false);
    setGiftModalVisible(true);
  };

  const handleReceiveFromFriend = () => {
    router.push("/camera/receive-scan");
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

  // For restaurant owners - show activity tabs
  if (isRestaurant) {
    return (
      <LinearGradient
        colors={isDark ? colors.gradient : ["#FFFFFF", "#F8FAFC"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("restaurant.activity")}
          </Text>
        </View>
        <RestaurantActivityTabs />
      </LinearGradient>
    );
  }

  // For regular users - show purchase options
  return (
    <>
      <LinearGradient
        colors={isDark ? colors.gradient : ["#FFFFFF", "#F8FAFC"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("purchase.title")}
          </Text>
        </View>

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
            <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
              {error.balances}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.error }]}
              onPress={loadBalances}
            >
              <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : restaurantsWithBalances.length > 0 ? (
          <RestaurantSelector
            restaurants={restaurantsWithBalances}
            onRestaurantChange={handleRestaurantChange}
          />
        ) : (
          <View
            style={[styles.noBalanceCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.noBalanceTitle, { color: colors.text }]}>
              {t("home.noBalances")}
            </Text>
            <Text
              style={[styles.noBalanceDesc, { color: colors.textSecondary }]}
            >
              {t("home.noBalancesDesc")}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedRestaurant && (
            <View style={styles.balanceSection}>
              <View style={styles.balanceRow}>
                <View
                  style={[
                    styles.balanceCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.balanceIcon,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <UtensilsCrossed size={24} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.balanceLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("purchase.mealPoints")}
                  </Text>
                  <Text style={[styles.balanceValue, { color: colors.text }]}>
                    {currentBalance.mealPoints}
                  </Text>
                </View>

                <View
                  style={[
                    styles.balanceCard,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.balanceIcon,
                      { backgroundColor: colors.secondary + "20" },
                    ]}
                  >
                    <Coffee size={24} color={colors.secondary} />
                  </View>
                  <Text
                    style={[
                      styles.balanceLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("purchase.drinkPoints")}
                  </Text>
                  <Text style={[styles.balanceValue, { color: colors.text }]}>
                    {currentBalance.drinkPoints}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.walletCard, { backgroundColor: colors.surface }]}
              >
                <View
                  style={[
                    styles.balanceIcon,
                    { backgroundColor: colors.success + "20" },
                  ]}
                >
                  <Wallet size={24} color={colors.success} />
                </View>
                <View style={styles.walletContent}>
                  <Text
                    style={[
                      styles.balanceLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("purchase.walletBalance")}
                  </Text>
                  <Text style={[styles.walletValue, { color: colors.text }]}>
                    ${currentBalance.walletBalance.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={handleRecharge}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <CreditCard size={32} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("purchase.recharge")}
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {t("purchase.rechargeDesc")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={handleGiftFriend}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.secondary + "20" },
              ]}
            >
              <Gift size={32} color={colors.secondary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t("purchase.gift")}
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {t("purchase.giftDesc")}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={[{ backgroundColor: colors.surface }]}>
            <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Camera size={32} color={colors.primary} />
              </View>
              <View style={[{ backgroundColor: colors.surface }]}>
                <Text style={[{ color: colors.text }]}>
                  {t("account.myQRCode")}
                </Text>
                <Text
                  style={[
                    styles.qrDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("account.qrCodeDesc")}
                </Text>
              </View>
              <View style={styles.qrContainer}>
                {profile?.qrCode ? (
                  <>
                    <QRCode
                      value={profile.qrCode}
                      size={200}
                      color={colors.text}
                      backgroundColor={colors.background}
                    />
                    <View style={styles.qrUserInfo}>
                      {profile.fullName && (
                        <Text
                          style={[styles.qrUserName, { color: colors.text }]}
                        >
                          {profile.fullName}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.qrUserEmail,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {auth.user?.email || profile.email}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View
                    style={[
                      styles.qrPlaceholder,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.qrPlaceholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("common.loading")}...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {selectedRestaurant && (
        <>
          <GiftModal
            visible={giftModalVisible}
            onClose={() => {
              setGiftModalVisible(false);
              setModalManuallyClosed(true);
            }}
            targetId={selectedRestaurant.id}
          />
          <PackagesModal
            visible={packagesModalVisible}
            onClose={() => setPackagesModalVisible(false)}
            restaurantId={selectedRestaurant.id}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for tabs
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  restaurantSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  balanceSection: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  balanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  walletContent: {
    marginLeft: 16,
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  walletValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCard: {
    borderRadius: 20,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  qrDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: "center",
    padding: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholderText: {
    fontSize: 16,
  },
  qrUserInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  qrUserName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  qrUserEmail: {
    fontSize: 14,
  },
  scansList: {
    flex: 1,
  },
  scansTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scanRecord: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scanRecordHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  scanRecordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scanRecordInfo: {
    flex: 1,
  },
  scanRecordType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scanRecordDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scanRecordTime: {
    fontSize: 14,
  },
  scanRecordPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsConsumed: {
    fontSize: 16,
    fontWeight: "bold",
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
