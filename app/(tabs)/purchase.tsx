import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
  InteractionManager,
} from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useBalance } from "@/hooks/useBalance";
import {
  Coffee,
  UtensilsCrossed,
  Check,
  Circle,
  Wallet,
  ListOrdered,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { router, useFocusEffect } from "expo-router";
import {
  RestaurantSelector,
  Restaurant,
} from "@/components/RestaurantSelector";
import {
  setSelectedRestaurant,
  type Restaurant as ReduxRestaurant,
} from "@/store/slices/restaurantSlice";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import WalletTopUpModal from "@/components/WalletTopUpModal";
import { CustomAlert } from "@/components/CustomAlert";
import { useAlert } from "@/contexts/AlertContext";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  fetchPaymentSecurity,
  type WalletBalanceData,
  type WalletLedgerEntry,
} from "@/api/walletPaymentApi";
import { getOrCreateWalletDeviceId } from "@/lib/deviceId";
import { walletLedgerTitleKey } from "@/lib/walletLedgerTitle";
import { getApiErrorMessage } from "@/lib/apiError";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GiftVoucherModal from "@/components/GiftVoucherModal";

const WALLET_TX_PREVIEW = 8;
/** Matches tab bar height used in other tab screens (see promotions.tsx). */
const TAB_BAR_HEIGHT = 88;

const STRIPE_PUBLISHABLE_KEY = (
  typeof process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY === "string"
    ? process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : ""
).trim();

type PurchaseTab = "loyalty" | "wallet";

function formatWalletTxWhen(iso: string, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PurchaseScreen() {
  const { t, i18n } = useTranslation();
  const { showToast } = useAlert();
  const dispatch = useDispatch();
  const { colors, isDark, defaultFontFamily, defaultFontFamilyBold } =
    useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const auth = useSelector((state: RootState) => state.auth);
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant,
  );
  const { restaurantsWithBalances, currentBalance, loadBalances, error } =
    useBalance();
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [needPinAlertVisible, setNeedPinAlertVisible] = useState(false);
  const [rechargePinLoading, setRechargePinLoading] = useState(false);
  const [globalWallet, setGlobalWallet] = useState<WalletBalanceData | null>(
    null,
  );
  const [globalWalletLoading, setGlobalWalletLoading] = useState(false);
  const [purchaseTab, setPurchaseTab] = useState<PurchaseTab>("loyalty");
  const [walletTxPreview, setWalletTxPreview] = useState<WalletLedgerEntry[]>(
    [],
  );
  const [walletTxLoading, setWalletTxLoading] = useState(false);
  const [walletTxRefreshing, setWalletTxRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarClearance = TAB_BAR_HEIGHT + insets.bottom;

  // Fetch user balances and wallet ledger balance when the screen focuses
  useFocusEffect(
    React.useCallback(() => {
      if (!auth.isAuthenticated) return;

      loadBalances();

      let cancelled = false;
      setGlobalWalletLoading(true);
      fetchWalletBalance()
        .then((data) => {
          if (!cancelled) setGlobalWallet(data);
        })
        .catch(() => {
          if (!cancelled) setGlobalWallet(null);
        })
        .finally(() => {
          if (!cancelled) setGlobalWalletLoading(false);
        });

      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated]),
  );

  const loadWalletTxPreview = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!auth.isAuthenticated) return;
      if (!opts?.silent) setWalletTxLoading(true);
      try {
        const batch = await fetchWalletTransactions(
          WALLET_TX_PREVIEW,
          undefined,
        );
        setWalletTxPreview(batch);
      } catch (e: unknown) {
        if (!opts?.silent) {
          showToast({
            message: getApiErrorMessage(e, t("wallet.transactionsError")),
            type: "error",
          });
        }
        setWalletTxPreview([]);
      } finally {
        if (!opts?.silent) setWalletTxLoading(false);
      }
    },
    [auth.isAuthenticated, showToast, t],
  );

  const refreshGlobalWallet = useCallback(() => {
    fetchWalletBalance()
      .then(setGlobalWallet)
      .catch(() => setGlobalWallet(null));
    void loadWalletTxPreview({ silent: true });
  }, [loadWalletTxPreview]);

  React.useEffect(() => {
    if (purchaseTab !== "wallet" || !auth.isAuthenticated) return;
    loadWalletTxPreview();
  }, [purchaseTab, auth.isAuthenticated, loadWalletTxPreview]);

  React.useEffect(() => {
    if (!auth.isAuthenticated) return;
    const sub = DeviceEventEmitter.addListener("wallet:balanceChanged", () => {
      refreshGlobalWallet();
    });
    return () => sub.remove();
  }, [auth.isAuthenticated, refreshGlobalWallet]);

  const onWalletTxRefresh = useCallback(async () => {
    setWalletTxRefreshing(true);
    try {
      await loadWalletTxPreview({ silent: true });
    } finally {
      setWalletTxRefreshing(false);
    }
  }, [loadWalletTxPreview]);

  const handleRecharge = useCallback(() => {
    if (!STRIPE_PUBLISHABLE_KEY) {
      showToast({
        message: t("wallet.stripeNotConfigured"),
        type: "error",
      });
      return;
    }
    setRechargePinLoading(true);
    void (async () => {
      try {
        const deviceId = await getOrCreateWalletDeviceId();
        const s = await fetchPaymentSecurity(deviceId);
        if (!s.hasPin) {
          setNeedPinAlertVisible(true);
          return;
        }
      } catch {
        /* If security check fails (e.g. offline), allow opening top-up. */
      } finally {
        setRechargePinLoading(false);
      }
      setTopUpModalVisible(true);
    })();
  }, [STRIPE_PUBLISHABLE_KEY, showToast, t]);

  const handleRestaurantChange = (restaurant: Restaurant) => {
    const restaurantForSlice: ReduxRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address ?? "",
      logo: restaurant.logo,
      userBalance: restaurant.userBalance ?? {
        walletBalance: 0,
        drinkPoints: 0,
        mealPoints: 0,
      },
    };
    dispatch(setSelectedRestaurant(restaurantForSlice));
    // Update selected restaurant balance
    dispatch(setSelectedRestaurantBalance(restaurant.id));
  };

  const cardBg = isDark ? colors.surface : colors.background;
  const iconBg = (hex: string) => (isDark ? hex + "20" : hex + "15");

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }, font]}>
            {t("purchase.title")}
          </Text>
        </View>

        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: isDark ? colors.surface + "99" : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              purchaseTab === "loyalty" && [
                styles.tabBtnActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setPurchaseTab("loyalty")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: purchaseTab === "loyalty" ? "#fff" : colors.text,
                },
                font,
              ]}
              numberOfLines={1}
            >
              {t("purchase.tabLoyalty")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              purchaseTab === "wallet" && [
                styles.tabBtnActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setPurchaseTab("wallet")}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: purchaseTab === "wallet" ? "#fff" : colors.text,
                },
                font,
              ]}
              numberOfLines={1}
            >
              {t("purchase.tabWallet")}
            </Text>
          </TouchableOpacity>
        </View>

        {purchaseTab === "loyalty" ? (
          <>
            <View style={styles.loyaltyTopInset}>
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
                  <Text
                    style={[styles.errorTitle, { color: colors.error }, font]}
                  >
                    {t("home.errorLoadingData")}
                  </Text>
                  <Text
                    style={[
                      styles.errorDesc,
                      { color: colors.textSecondary },
                      font,
                    ]}
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
              ) : restaurantsWithBalances.length > 0 ? (
                <RestaurantSelector
                  restaurants={restaurantsWithBalances}
                  onRestaurantChange={handleRestaurantChange}
                />
              ) : (
                <View
                  style={[
                    styles.noBalanceCard,
                    { backgroundColor: cardBg, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.noBalanceTitle,
                      { color: colors.text },
                      font,
                    ]}
                  >
                    {t("home.noBalances")}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              style={[styles.content, { backgroundColor: colors.background }]}
              contentContainerStyle={[
                styles.scrollContent,
                { backgroundColor: colors.background },
              ]}
            >
              {selectedRestaurant && (
                <View style={styles.balanceSection}>
                  {/* Meal Vouchers Card - same as website */}
                  <View
                    style={[
                      styles.voucherCard,
                      { backgroundColor: cardBg, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.voucherCardHeader}>
                      <View
                        style={[
                          styles.voucherIcon,
                          { backgroundColor: iconBg(colors.primary) },
                        ]}
                      >
                        <UtensilsCrossed size={22} color={colors.primary} />
                      </View>
                      <View style={styles.voucherTextBlock}>
                        <Text
                          style={[
                            styles.voucherTitle,
                            { color: colors.text },
                            font,
                          ]}
                        >
                          {t("purchase.mealVouchers", {
                            count: currentBalance.mealVouchers,
                          })}
                        </Text>
                        {currentBalance.mealPerVoucher > 0 && (
                          <Text
                            style={[
                              styles.voucherSubtitle,
                              { color: colors.textSecondary },
                              font,
                            ]}
                          >
                            {t("purchase.pointsTowardNext", {
                              current: currentBalance.mealTowardNext,
                              total: currentBalance.mealPerVoucher,
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                    {currentBalance.mealPerVoucher > 0 && (
                      <View style={styles.voucherDotsRow}>
                        {Array.from(
                          { length: currentBalance.mealPerVoucher },
                          (_, i) => (
                            <View
                              key={`meal-${i}`}
                              style={[
                                styles.voucherDot,
                                i < currentBalance.mealTowardNext
                                  ? { backgroundColor: colors.primary }
                                  : {
                                      backgroundColor: "transparent",
                                      borderWidth: 2,
                                      borderColor: colors.textSecondary,
                                    },
                              ]}
                            >
                              {i < currentBalance.mealTowardNext ? (
                                <Check size={14} color="#fff" strokeWidth={3} />
                              ) : (
                                <Circle
                                  size={14}
                                  color={colors.textSecondary}
                                  strokeWidth={1.5}
                                />
                              )}
                            </View>
                          ),
                        )}
                      </View>
                    )}
                  </View>

                  {/* Drink Vouchers Card - same as website */}
                  <View
                    style={[
                      styles.voucherCard,
                      { backgroundColor: cardBg, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.voucherCardHeader}>
                      <View
                        style={[
                          styles.voucherIcon,
                          { backgroundColor: iconBg(colors.secondary) },
                        ]}
                      >
                        <Coffee size={22} color={colors.secondary} />
                      </View>
                      <View style={styles.voucherTextBlock}>
                        <Text
                          style={[
                            styles.voucherTitle,
                            { color: colors.text },
                            font,
                          ]}
                        >
                          {t("purchase.drinkVouchers", {
                            count: currentBalance.drinkVouchers,
                          })}
                        </Text>
                        {currentBalance.drinkPerVoucher > 0 && (
                          <Text
                            style={[
                              styles.voucherSubtitle,
                              { color: colors.textSecondary },
                              font,
                            ]}
                          >
                            {t("purchase.pointsTowardNext", {
                              current: currentBalance.drinkTowardNext,
                              total: currentBalance.drinkPerVoucher,
                            })}
                          </Text>
                        )}
                      </View>
                    </View>
                    {currentBalance.drinkPerVoucher > 0 && (
                      <View style={styles.voucherDotsRow}>
                        {Array.from(
                          { length: currentBalance.drinkPerVoucher },
                          (_, i) => (
                            <View
                              key={`drink-${i}`}
                              style={[
                                styles.voucherDot,
                                i < currentBalance.drinkTowardNext
                                  ? { backgroundColor: colors.secondary }
                                  : {
                                      backgroundColor: "transparent",
                                      borderWidth: 2,
                                      borderColor: colors.textSecondary,
                                    },
                              ]}
                            >
                              {i < currentBalance.drinkTowardNext ? (
                                <Check size={14} color="#fff" strokeWidth={3} />
                              ) : (
                                <Circle
                                  size={14}
                                  color={colors.textSecondary}
                                  strokeWidth={1.5}
                                />
                              )}
                            </View>
                          ),
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          <View
            style={[
              styles.walletTabRoot,
              {
                backgroundColor: colors.background,
                paddingBottom: tabBarClearance + 16,
              },
            ]}
          >
            {!auth.isAuthenticated ? (
              <View style={styles.walletSignInWrap}>
                <Text
                  style={[
                    styles.walletSignInHint,
                    { color: colors.textSecondary },
                    font,
                  ]}
                >
                  {t("purchase.walletTabSignIn")}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.walletTabWalletBlock}>
                  <View
                    style={[
                      styles.globalWalletCard,
                      {
                        backgroundColor: isDark
                          ? colors.surface
                          : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.globalWalletRow}>
                      <View
                        style={[
                          styles.globalWalletIconWrap,
                          { backgroundColor: colors.primary + "22" },
                        ]}
                      >
                        <Wallet size={20} color={colors.primary} />
                      </View>
                      <View style={styles.globalWalletTextCol}>
                        <Text
                          style={[
                            styles.globalWalletLabel,
                            { color: colors.textSecondary },
                            font,
                          ]}
                          numberOfLines={1}
                        >
                          {t("home.globalWalletTitle", "Wallet balance")}
                        </Text>
                        {globalWalletLoading ? (
                          <ActivityIndicator
                            style={styles.globalWalletSpinner}
                            color={colors.primary}
                            size="small"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.globalWalletAmount,
                              {
                                color: isDark ? "#4ADE80" : "#047857",
                                fontFamily: defaultFontFamilyBold,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {globalWallet
                              ? `${Number(globalWallet.balance).toLocaleString(
                                  i18n.language === "ar"
                                    ? "ar-EG"
                                    : i18n.language === "de"
                                      ? "de-DE"
                                      : "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )} ${globalWallet.currency}`
                              : "—"}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.globalWalletTxIcon,
                          { backgroundColor: colors.primary + "14" },
                        ]}
                        onPress={() => router.push("/wallet-transactions")}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={t(
                          "home.viewWalletTransactions",
                          "Transaction history",
                        )}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <ListOrdered size={22} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.walletActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.walletActionBtn,
                        styles.walletRechargeBtn,
                        {
                          backgroundColor: colors.primary,
                          opacity: rechargePinLoading ? 0.65 : 1,
                        },
                      ]}
                      onPress={handleRecharge}
                      disabled={rechargePinLoading}
                      activeOpacity={0.85}
                    >
                      {rechargePinLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[{ color: "#fff", fontSize: 15 }, font]}>
                          {t("purchase.recharge")}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.walletActionBtn,
                        styles.walletGiftBtn,
                        { backgroundColor: colors.secondary },
                      ]}
                      onPress={() => setGiftModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <Gift size={16} color="#fff" />
                      <Text style={[{ color: "#fff", fontSize: 15 }, font]}>
                        {t("purchase.giftVoucherAction", "Gift")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text
                  style={[
                    styles.walletTxSectionTitle,
                    { color: colors.text },
                    font,
                  ]}
                >
                  {t("wallet.transactions")}
                </Text>

                <ScrollView
                  style={styles.walletTxScroll}
                  contentContainerStyle={[
                    styles.walletTxScrollInner,
                    walletTxPreview.length === 0
                      ? styles.walletTxScrollInnerEmpty
                      : null,
                    {
                      paddingBottom:
                        tabBarClearance +
                        (walletTxPreview.length > 0 ? 28 : 16),
                    },
                  ]}
                  refreshControl={
                    <RefreshControl
                      refreshing={walletTxRefreshing}
                      onRefresh={onWalletTxRefresh}
                      tintColor={colors.primary}
                    />
                  }
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {walletTxLoading && walletTxPreview.length === 0 ? (
                    <ActivityIndicator
                      style={styles.walletTxScrollSpinner}
                      color={colors.primary}
                      size="large"
                    />
                  ) : walletTxPreview.length === 0 ? (
                    <Text
                      style={[
                        styles.walletTxEmpty,
                        { color: colors.textSecondary },
                        font,
                      ]}
                    >
                      {t("wallet.noTransactions")}
                    </Text>
                  ) : (
                    walletTxPreview.map((item) => {
                      const credit = item.type === "CREDIT";
                      const titleKey = walletLedgerTitleKey(
                        item.type,
                        item.source,
                        "user",
                        item.metadata,
                      );
                      const title = titleKey
                        ? t(titleKey)
                        : credit
                          ? t("wallet.credit")
                          : t("wallet.debit");
                      const cur = globalWallet?.currency ?? "EUR";
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.walletTxRow,
                            {
                              backgroundColor: cardBg,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.walletTxRowIcon,
                              {
                                backgroundColor:
                                  (credit ? colors.success : colors.error) +
                                  "22",
                              },
                            ]}
                          >
                            {credit ? (
                              <ArrowDownLeft size={20} color={colors.success} />
                            ) : (
                              <ArrowUpRight size={20} color={colors.error} />
                            )}
                          </View>
                          <View style={styles.walletTxRowBody}>
                            <Text
                              style={[
                                { color: colors.text, fontSize: 14 },
                                font,
                              ]}
                              numberOfLines={2}
                            >
                              {title}
                            </Text>
                            <Text
                              style={[
                                {
                                  color: colors.textSecondary,
                                  fontSize: 11,
                                  marginTop: 4,
                                },
                                font,
                              ]}
                            >
                              {formatWalletTxWhen(
                                item.createdAt,
                                i18n.language,
                              )}
                            </Text>
                          </View>
                          <Text
                            style={[
                              {
                                color: credit ? colors.success : colors.error,
                                fontSize: 14,
                              },
                              font,
                            ]}
                          >
                            {credit ? "+" : "−"}
                            {item.amount} {cur}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.viewAllTxBtn,
                    {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "12",
                    },
                  ]}
                  onPress={() => router.push("/wallet-transactions")}
                  activeOpacity={0.85}
                >
                  <ListOrdered size={20} color={colors.primary} />
                  <Text
                    style={[{ color: colors.primary, marginLeft: 8 }, font]}
                  >
                    {t("purchase.viewAllTransactions")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {STRIPE_PUBLISHABLE_KEY ? (
        <WalletTopUpModal
          visible={topUpModalVisible}
          onClose={() => setTopUpModalVisible(false)}
          onSuccess={refreshGlobalWallet}
          publishableKey={STRIPE_PUBLISHABLE_KEY}
        />
      ) : null}
      <GiftVoucherModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
      />

      <CustomAlert
        visible={needPinAlertVisible}
        type="warning"
        title={t("walletPayment.needPinAlertTitle")}
        message={t("walletPayment.needPin")}
        cancelText={t("common.close")}
        confirmText={t("walletPayment.setPaymentPinCta")}
        onCancel={() => setNeedPinAlertVisible(false)}
        onConfirm={() => {
          setNeedPinAlertVisible(false);
          router.navigate({
            pathname: "/(tabs)/account",
            params: { focusPaymentPin: "1" },
          } as never);
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              DeviceEventEmitter.emit("account:scrollToPaymentPin");
            }, 400);
          });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for tabs
    backgroundColor: "transparent",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  globalWalletSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  walletRechargeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  walletActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  walletActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  walletGiftBtn: {
    flexDirection: "row",
    gap: 8,
  },
  globalWalletCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  globalWalletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  globalWalletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  globalWalletTextCol: {
    flex: 1,
    minWidth: 0,
  },
  globalWalletLabel: {
    fontSize: 11,
  },
  globalWalletAmount: {
    fontSize: 19,
    marginTop: 2,
  },
  globalWalletSpinner: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  globalWalletTxIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  /** Same horizontal inset as `tabBar` (selector, error, no-balance strip). */
  loyaltyTopInset: {
    marginHorizontal: 20,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 12,
    textAlign: "center",
  },
  walletTabRoot: {
    flex: 1,
    paddingHorizontal: 20,
  },
  walletSignInWrap: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  walletTabWalletBlock: {
    marginBottom: 16,
  },
  walletSignInHint: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  walletTxSectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 2,
  },
  walletTxScroll: {
    flex: 1,
    minHeight: 140,
  },
  walletTxScrollInner: {
    paddingTop: 2,
  },
  walletTxScrollInnerEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 200,
  },
  walletTxScrollSpinner: {
    paddingVertical: 40,
  },
  walletTxEmpty: {
    textAlign: "center",
    fontSize: 14,
    paddingHorizontal: 12,
  },
  walletTxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  walletTxRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  walletTxRowBody: {
    flex: 1,
    minWidth: 0,
  },
  viewAllTxBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  restaurantSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  balanceSection: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  voucherCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  voucherCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  voucherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherTextBlock: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  voucherSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  voucherDotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  voucherDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
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
