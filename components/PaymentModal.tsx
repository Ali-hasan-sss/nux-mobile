import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  DeviceEventEmitter,
  InteractionManager,
} from "react-native";
import axios from "axios";
import { Text } from "@/components/AppText";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Coffee,
  UtensilsCrossed,
  ChevronRight,
  Scan,
  Wallet,
  X,
} from "lucide-react-native";
import { router } from "expo-router";
import { RootState } from "@/store/store";
import { updateRestaurantBalance } from "@/store/slices/restaurantSlice";
import { processPayment } from "@/store/slices/balanceSlice";
import { useTheme } from "@/hooks/useTheme";
import { useBalance } from "@/hooks/useBalance";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Toast, ToastType } from "./Toast";
import { CustomAlert } from "@/components/CustomAlert";
import {
  requestWalletPayment,
  type WalletBalanceData,
} from "@/api/walletPaymentApi";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  RestaurantSelector,
  type Restaurant as SelectorRestaurant,
} from "@/components/RestaurantSelector";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import type { TFunction } from "i18next";

function getPaymentModalErrorMessage(e: unknown, t: TFunction): string {
  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    const apiMessage =
      typeof e.response?.data?.message === "string"
        ? e.response.data.message.toLowerCase()
        : "";
    const apiCode =
      typeof e.response?.data?.code === "string"
        ? e.response.data.code
        : "";

    if (status === 428) return t("walletPayment.needPin");
    if (status === 401 || apiCode === "PIN_INVALID" || apiMessage.includes("invalid pin")) {
      return t("walletPayment.invalidPin");
    }
    if (apiMessage.includes("insufficient")) return t("payment.insufficientBalance");
    if (apiMessage.includes("restaurant") && apiMessage.includes("not found")) {
      return t("payment.selectRestaurantFirst");
    }
  }
  return getApiErrorMessage(e, t("common.error"));
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  asScreen?: boolean;
  /** Initial choice: meal or drink voucher only (no wallet). */
  initialPaymentType?: "drink" | "meal";
  restaurantId?: string;
  restaurantName?: string;
  /** Global app wallet (Stripe ledger); enables pay-at-restaurant without loyalty points. */
  globalWallet?: WalletBalanceData | null;
  /** True while GET wallet balance is in flight (e.g. payment screen after scan). */
  walletLedgerLoading?: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  asScreen = false,
  initialPaymentType = "meal",
  restaurantId,
  restaurantName,
  globalWallet = null,
  walletLedgerLoading = false,
}: PaymentModalProps) {
  const { t, i18n } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const dispatch = useDispatch();
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
  );
  const { refreshBalances, currentBalance, restaurantsWithBalances, loading } =
    useBalance();

  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "drink" | "meal"
  >(initialPaymentType);
  /** meal/drink = loyalty voucher; wallet = app wallet (needs restaurant via list or scan). */
  const [paySource, setPaySource] = useState<"meal" | "drink" | "wallet">(
    "meal",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAmountStr, setWalletAmountStr] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "info",
  });
  const [needPinAlertVisible, setNeedPinAlertVisible] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Show toast function
  const showToast = (message: string, type: ToastType) => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Reset when modal opens and refresh balances
  React.useEffect(() => {
    if (visible) {
      refreshBalances();
      translateX.value = 0;
      setModalError(null);
    }
  }, [visible]);

  // Only set initial payment type when modal first opens
  const [hasSetInitialType, setHasSetInitialType] = React.useState(false);
  React.useEffect(() => {
    if (visible && initialPaymentType && !hasSetInitialType) {
      setSelectedPaymentType(initialPaymentType);
      setHasSetInitialType(true);
    }
    if (!visible) {
      setHasSetInitialType(false);
    }
  }, [visible, initialPaymentType, hasSetInitialType]);

  React.useEffect(() => {
    if (!visible) setWalletAmountStr("");
  }, [visible]);

  const targetRestaurantId = restaurantId || selectedRestaurant?.id;
  const needsRestaurantPick = !targetRestaurantId;

  const showBalancesLoader =
    visible &&
    Boolean(targetRestaurantId) &&
    (loading.balances || walletLedgerLoading);

  const globalWalletNum =
    globalWallet != null ? Number(globalWallet.balance) : 0;
  const hasGlobalWalletFunds = globalWalletNum > 0;

  const hasLoyalty =
    Boolean(targetRestaurantId) &&
    (currentBalance.mealPoints > 0 || currentBalance.drinkPoints > 0);
  const showLoyaltyFlow = hasLoyalty;
  const showWalletFlow =
    Boolean(targetRestaurantId) && hasGlobalWalletFunds && paySource === "wallet";

  useEffect(() => {
    if (!visible) return;
    const tid = restaurantId || selectedRestaurant?.id;
    if (!tid && hasGlobalWalletFunds) {
      setPaySource("wallet");
    } else if (!tid) {
      setPaySource("meal");
    }
  }, [visible, restaurantId, selectedRestaurant?.id, hasGlobalWalletFunds]);

  useEffect(() => {
    if (!visible) return;
    const tid = restaurantId || selectedRestaurant?.id;
    if (!tid) return;
    if (hasLoyalty) {
      if (!(paySource === "wallet" && hasGlobalWalletFunds)) {
        setPaySource(selectedPaymentType);
      }
    } else if (hasGlobalWalletFunds) {
      setPaySource("wallet");
    }
  }, [
    visible,
    restaurantId,
    selectedRestaurant?.id,
    hasLoyalty,
    hasGlobalWalletFunds,
    selectedPaymentType,
    paySource,
  ]);

  const handlePayModalRestaurantChange = (r: SelectorRestaurant) => {
    dispatch(setSelectedRestaurantBalance(r.id));
  };

  // Voucher-only: meal or drink, pay one full voucher (points per voucher)
  const pointsPerVoucher =
    selectedPaymentType === "meal"
      ? currentBalance.mealPerVoucher
      : currentBalance.drinkPerVoucher;
  const availablePoints =
    selectedPaymentType === "meal"
      ? currentBalance.mealPoints
      : currentBalance.drinkPoints;
  const voucherAmount = pointsPerVoucher; // always one voucher
  const hasInsufficientBalance = availablePoints < voucherAmount;

  const paymentOptions = [
    {
      type: "meal" as const,
      label: t("purchase.mealVouchers", { count: currentBalance.mealVouchers }),
      icon: UtensilsCrossed,
      balance: currentBalance.mealPoints,
      pointsPerVoucher: currentBalance.mealPerVoucher,
      color: colors.primary,
    },
    {
      type: "drink" as const,
      label: t("purchase.drinkVouchers", { count: currentBalance.drinkVouchers }),
      icon: Coffee,
      balance: currentBalance.drinkPoints,
      pointsPerVoucher: currentBalance.drinkPerVoucher,
      color: colors.secondary,
    },
  ];

  const selectedOption = paymentOptions.find(
    (option) => option.type === selectedPaymentType
  );

  const normalizedWalletInput = walletAmountStr.replace(",", ".").trim();
  const walletPayAmountNum = parseFloat(normalizedWalletInput);
  const walletAmountValid =
    hasGlobalWalletFunds &&
    globalWallet != null &&
    Number.isFinite(walletPayAmountNum) &&
    walletPayAmountNum > 0 &&
    walletPayAmountNum <= globalWalletNum + 1e-9;
  const walletSlideOk =
    paySource === "wallet" && walletAmountValid && Boolean(targetRestaurantId);

  const showWalletPaymentForm =
    hasGlobalWalletFunds &&
    globalWallet != null &&
    paySource === "wallet";

  const loyaltySlideOk =
    showLoyaltyFlow && paySource !== "wallet" && !hasInsufficientBalance;

  const handleSlideConfirm = async () => {
    const rid = restaurantId || selectedRestaurant?.id;

    if (!rid) {
      setModalError(t("payment.selectRestaurantFirst"));
      showToast(t("payment.selectRestaurantFirst"), "error");
      return;
    }

    if (currentBalance.drinkPoints === 0 && currentBalance.mealPoints === 0) {
      setModalError(t("payment.noBalanceData"));
      showToast(t("payment.noBalanceData"), "error");
      return;
    }

    if (hasInsufficientBalance) {
      setModalError(t("payment.insufficientBalance"));
      showToast(t("payment.insufficientBalance"), "error");
      return;
    }

    setIsProcessing(true);
    setModalError(null);

    try {
      const currencyTypeMap = {
        meal: "stars_meal" as const,
        drink: "stars_drink" as const,
      };

      const paymentData = {
        targetId: rid,
        amount: voucherAmount,
        currencyType: currencyTypeMap[selectedPaymentType],
      };

      const result = await dispatch(processPayment(paymentData) as any);
      if (result.type.endsWith("/rejected")) {
        throw new Error((result.payload as string) || "Payment failed");
      }

      refreshBalances();

      const newBalance = (selectedOption?.balance || 0) - voucherAmount;
      dispatch(
        updateRestaurantBalance({
          restaurantId: rid,
          balanceType:
            selectedPaymentType === "meal" ? "mealPoints" : "drinkPoints",
          amount: newBalance,
        })
      );

      showToast(t("payment.paymentSuccessful"), "success");
      translateX.value = 0;

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Payment failed:", error);
      const message = getPaymentModalErrorMessage(error, t);
      setModalError(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayRequest = async () => {
    const rid = restaurantId || selectedRestaurant?.id;
    if (!rid) {
      setModalError(t("payment.selectRestaurantFirst"));
      showToast(t("payment.selectRestaurantFirst"), "error");
      return;
    }
    if (!globalWallet || !hasGlobalWalletFunds) {
      setModalError(t("payment.noBalanceData"));
      showToast(t("payment.noBalanceData"), "error");
      return;
    }
    const normalized = walletAmountStr.replace(",", ".").trim();
    const amt = parseFloat(normalized);
    if (!Number.isFinite(amt) || amt <= 0) {
      setModalError(t("wallet.invalidAmount"));
      showToast(t("wallet.invalidAmount"), "error");
      return;
    }
    if (amt > globalWalletNum + 1e-9) {
      setModalError(t("payment.walletExceedsBalance"));
      showToast(t("payment.walletExceedsBalance"), "error");
      return;
    }

    setIsProcessing(true);
    setModalError(null);
    try {
      await requestWalletPayment({
        restaurantId: rid,
        amount: amt,
        currency: globalWallet.currency || "EUR",
        idempotencyKey: `home-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      });
      showToast(t("payment.walletPaySent"), "success");
      translateX.value = 0;
      onClose();
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 428) {
        setNeedPinAlertVisible(true);
        setModalError(t("walletPayment.needPin"));
      } else {
        const message = getPaymentModalErrorMessage(e, t);
        setModalError(message);
        showToast(message, "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const walletSlideOkSV = useSharedValue(false);
  const loyaltySlideOkSV = useSharedValue(false);

  useEffect(() => {
    walletSlideOkSV.value = walletSlideOk;
    loyaltySlideOkSV.value = loyaltySlideOk;
  }, [walletSlideOk, loyaltySlideOk, walletSlideOkSV, loyaltySlideOkSV]);

  const translateX = useSharedValue(0);

  // Swipe to pay: loyalty voucher or wallet amount (LTR)
  const panGesture = Gesture.Pan()
    .enabled(!isProcessing && (loyaltySlideOk || walletSlideOk))
    .onUpdate((event) => {
      const max = 220;
      const delta = Math.max(0, event.translationX);
      translateX.value = Math.min(delta, max);
    })
    .onEnd(() => {
      const threshold = 200;
      if (translateX.value > threshold) {
        if (walletSlideOkSV.value) {
          runOnJS(handleWalletPayRequest)();
        } else if (loyaltySlideOkSV.value) {
          runOnJS(handleSlideConfirm)();
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          {/* Center Loader */}
          {isProcessing && (
            <View style={styles.centerLoader}>
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loaderText}>
                  {t("payment.processingPayment")}
                </Text>
              </View>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            style={styles.modalContentWrapper}
          >
            <ScrollView
              contentContainerStyle={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                {needsRestaurantPick
                  ? t("payment.selectPaymentMethod")
                  : showWalletFlow
                    ? t("payment.walletPayTitle")
                    : t("payment.selectPaymentMethod")}
              </Text>

              {showBalancesLoader ? (
                <View
                  style={[
                    styles.balancesLoaderCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.text, marginBottom: 16, textAlign: "center" },
                    ]}
                  >
                    {t("payment.currentBalance")} —{" "}
                    {restaurantName || selectedRestaurant?.name || t("home.restaurant")}
                  </Text>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.balancesLoaderText,
                      {
                        color: colors.textSecondary,
                        fontFamily: defaultFontFamily,
                      },
                    ]}
                  >
                    {t("payment.loadingBalances")}
                  </Text>
                  <View style={styles.balancePlaceholderRow}>
                    <View
                      style={[
                        styles.balancePlaceholderBar,
                        { backgroundColor: colors.border + "99" },
                      ]}
                    />
                    <View
                      style={[
                        styles.balancePlaceholderBar,
                        styles.balancePlaceholderBarShort,
                        { backgroundColor: colors.border + "99" },
                      ]}
                    />
                  </View>
                  <View style={[styles.balancePlaceholderRow, { marginTop: 10 }]}>
                    <View
                      style={[
                        styles.balancePlaceholderBar,
                        styles.balancePlaceholderBarMedium,
                        { backgroundColor: colors.border + "99" },
                      ]}
                    />
                    <View
                      style={[
                        styles.balancePlaceholderBar,
                        { backgroundColor: colors.border + "99", width: "28%" },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <>
              {!showWalletFlow ? (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("payment.currentBalance")} —{" "}
                  {restaurantName || selectedRestaurant?.name || t("home.restaurant")}
                </Text>
              ) : null}

              {showWalletFlow ? (
                <View
                  style={[
                    styles.walletRestaurantConfirmCard,
                    {
                      backgroundColor: colors.primary + "16",
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.walletRestaurantConfirmLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("payment.walletPayPayingAt")}
                  </Text>
                  <Text
                    style={[
                      styles.walletRestaurantConfirmName,
                      { color: colors.text },
                    ]}
                    numberOfLines={2}
                  >
                    {restaurantName || selectedRestaurant?.name || t("home.restaurant")}
                  </Text>
                  <Text
                    style={[
                      styles.walletRestaurantConfirmHint,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("payment.walletPayEnterAmountThenSlide")}
                  </Text>
                </View>
              ) : null}

              {needsRestaurantPick ? (
                <View style={{ marginBottom: 10 }}>
                  <Text
                    style={[
                      styles.paymentMethodsSectionTitle,
                      { color: colors.text },
                    ]}
                  >
                    {t("payment.paymentMethodsTitle")}
                  </Text>
                  <Text
                    style={[
                      styles.pickRestaurantHint,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("payment.loyaltyOptionsDisabledUntilRestaurant")}
                  </Text>

                  <View style={styles.loyaltyPairRow}>
                    {paymentOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <View
                          key={option.type}
                          style={[
                            styles.paymentOption,
                            styles.paymentOptionHalf,
                            styles.paymentOptionDisabled,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <IconComponent size={20} color={colors.textSecondary} />
                          <View style={styles.optionContent}>
                            <Text
                              style={[
                                styles.optionLabelCompact,
                                { color: colors.textSecondary },
                              ]}
                              numberOfLines={2}
                            >
                              {option.label}
                            </Text>
                            <Text
                              style={[
                                styles.optionBalanceCompact,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {option.balance} {t("payment.points")}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {hasGlobalWalletFunds && globalWallet ? (
                    <TouchableOpacity
                      style={[
                        styles.paymentOption,
                        styles.walletOptionRow,
                        {
                          backgroundColor:
                            paySource === "wallet"
                              ? colors.primary + "18"
                              : colors.surface,
                          borderColor:
                            paySource === "wallet"
                              ? colors.primary
                              : colors.border,
                          opacity: isProcessing ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => !isProcessing && setPaySource("wallet")}
                      disabled={isProcessing}
                      activeOpacity={0.85}
                    >
                      <Wallet size={22} color={colors.primary} />
                      <View style={styles.optionContent}>
                        <Text
                          style={[styles.optionLabel, { color: colors.text }]}
                        >
                          {t("payment.payWithWalletOption")}
                        </Text>
                        <Text
                          style={[
                            styles.optionBalance,
                            { color: colors.primary },
                          ]}
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
                    </TouchableOpacity>
                  ) : null}

                  {paySource === "wallet" && hasGlobalWalletFunds ? (
                    <View style={{ marginTop: 6 }}>
                      <TouchableOpacity
                        style={[
                          styles.scanRestaurantBtn,
                          styles.scanRestaurantBtnCompact,
                          {
                            borderColor: colors.primary,
                            opacity: isProcessing ? 0.5 : 1,
                          },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/camera/scan",
                            params: {
                              walletPay: "1",
                              openPaymentScreen: asScreen ? "1" : "0",
                              paymentType: selectedPaymentType,
                            },
                          } as never)
                        }
                        disabled={isProcessing}
                        activeOpacity={0.85}
                      >
                        <Scan size={20} color={colors.primary} />
                        <Text
                          style={[
                            styles.scanRestaurantBtnText,
                            styles.scanRestaurantBtnTextCompact,
                            {
                              color: colors.primary,
                              fontFamily: defaultFontFamily,
                            },
                          ]}
                        >
                          {t("payment.scanRestaurantQr")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {restaurantsWithBalances.length > 0 ? (
                    <View style={{ marginTop: 12 }}>
                      <Text
                        style={[
                          styles.pickRestaurantHint,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("payment.orChooseRestaurantFromList")}
                      </Text>
                      <RestaurantSelector
                        restaurants={restaurantsWithBalances}
                        onRestaurantChange={handlePayModalRestaurantChange}
                      />
                    </View>
                  ) : paySource !== "wallet" ? (
                    <Text
                      style={[
                        styles.pickRestaurantEmpty,
                        { color: colors.error },
                      ]}
                    >
                      {t("payment.noRestaurantsForPay")}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {showLoyaltyFlow ? (
                <>
                  <Text
                    style={[
                      styles.selectedPaymentType,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("payment.selectedMethod")}:{" "}
                    {paySource === "wallet"
                      ? t("payment.payWithWalletOption")
                      : paymentOptions.find(
                          (opt) => opt.type === selectedPaymentType,
                        )?.label}
                  </Text>

                  <View style={styles.loyaltyPairRow}>
                    {paymentOptions.map((option) => {
                      const IconComponent = option.icon;
                      const isSelected = paySource === option.type;

                      return (
                        <TouchableOpacity
                          key={option.type}
                          style={[
                            styles.paymentOption,
                            styles.paymentOptionHalf,
                            {
                              backgroundColor: isSelected
                                ? option.color + "20"
                                : colors.surface,
                              borderColor: isSelected
                                ? option.color
                                : colors.border,
                              opacity: isProcessing ? 0.5 : 1,
                            },
                          ]}
                          onPress={() => {
                            if (!isProcessing) {
                              setSelectedPaymentType(option.type);
                              setPaySource(option.type);
                            }
                          }}
                          disabled={isProcessing}
                        >
                          <IconComponent size={20} color={option.color} />
                          <View style={styles.optionContent}>
                            <Text
                              style={[
                                styles.optionLabelCompact,
                                { color: colors.text },
                              ]}
                              numberOfLines={2}
                            >
                              {option.label}
                            </Text>
                            <Text
                              style={[
                                styles.optionBalanceCompact,
                                { color: option.color },
                              ]}
                            >
                              {option.balance} {t("payment.points")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {hasGlobalWalletFunds && globalWallet ? (
                    <TouchableOpacity
                      style={[
                        styles.paymentOption,
                        styles.walletOptionRow,
                        {
                          backgroundColor:
                            paySource === "wallet"
                              ? colors.primary + "18"
                              : colors.surface,
                          borderColor:
                            paySource === "wallet"
                              ? colors.primary
                              : colors.border,
                          opacity: isProcessing ? 0.5 : 1,
                          marginBottom: 10,
                        },
                      ]}
                      onPress={() => !isProcessing && setPaySource("wallet")}
                      disabled={isProcessing}
                      activeOpacity={0.85}
                    >
                      <Wallet size={22} color={colors.primary} />
                      <View style={styles.optionContent}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                          {t("payment.payWithWalletOption")}
                        </Text>
                        <Text style={[styles.optionBalance, { color: colors.primary }]}>
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
                    </TouchableOpacity>
                  ) : null}

                  {paySource !== "wallet" ? (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t("payment.payOneVoucher")}
                      </Text>
                      <Text
                        style={[
                          styles.voucherDetail,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("payment.oneVoucher", { points: pointsPerVoucher })}
                      </Text>

                      {hasInsufficientBalance && (
                        <Text style={[styles.errorText, { color: colors.error }]}>
                          {t("payment.insufficientBalance")}
                        </Text>
                      )}

                      <View
                        style={[
                          styles.slideContainer,
                          styles.slideContainerCompact,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.slideHints}>
                          {Array.from({ length: 4 }).map((_, index) => (
                            <ChevronRight
                              key={index}
                              size={20}
                              color={colors.textSecondary}
                              style={styles.slideHintArrow}
                            />
                          ))}
                        </View>

                        <GestureDetector gesture={panGesture}>
                          <Animated.View
                            style={[
                              styles.slideButton,
                              styles.slideButtonCompact,
                              animatedStyle,
                              {
                                backgroundColor: isProcessing
                                  ? colors.primary + "50"
                                  : colors.primary,
                                opacity: isProcessing ? 0.5 : 1,
                                left: 4,
                                right: undefined,
                              },
                            ]}
                          >
                            <ChevronRight
                              size={24}
                              color="#fff"
                              strokeWidth={2.5}
                            />
                          </Animated.View>
                        </GestureDetector>
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}

              {showWalletPaymentForm && globalWallet ? (
                <>
                  <Text
                    style={[
                      styles.voucherDetail,
                      styles.voucherDetailTight,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("payment.walletBalanceLabel")}:{" "}
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
                  <TextInput
                    value={walletAmountStr}
                    onChangeText={setWalletAmountStr}
                    keyboardType="decimal-pad"
                    placeholder={t("payment.walletAmountPlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    editable={!isProcessing}
                    style={[
                      styles.walletAmountInput,
                      styles.walletAmountInputCompact,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        fontFamily: defaultFontFamily,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.voucherDetail,
                      styles.voucherDetailTight,
                      { color: colors.textSecondary, marginTop: 4 },
                    ]}
                  >
                    {t("payment.walletPayHint")}
                  </Text>

                  {normalizedWalletInput !== "" && !walletAmountValid ? (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {Number.isFinite(walletPayAmountNum) &&
                      walletPayAmountNum > globalWalletNum
                        ? t("payment.walletExceedsBalance")
                        : t("wallet.invalidAmount")}
                    </Text>
                  ) : null}

                  {!targetRestaurantId ? (
                    <Text
                      style={[
                        styles.walletSlidePrereqHint,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("payment.selectRestaurantFirst")}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.sectionTitle,
                      styles.sectionTitleTight,
                      { color: colors.text },
                    ]}
                  >
                    {t("payment.slideToConfirm")}
                  </Text>
                  <View
                    style={[
                      styles.slideContainer,
                      styles.slideContainerCompact,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: walletSlideOk ? 1 : 0.45,
                      },
                    ]}
                  >
                    <View style={styles.slideHints}>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <ChevronRight
                          key={index}
                          size={18}
                          color={colors.textSecondary}
                          style={styles.slideHintArrow}
                        />
                      ))}
                    </View>
                    <GestureDetector gesture={panGesture}>
                      <Animated.View
                        style={[
                          styles.slideButton,
                          styles.slideButtonCompact,
                          animatedStyle,
                          {
                            backgroundColor: isProcessing
                              ? colors.primary + "50"
                              : colors.primary,
                            opacity: isProcessing ? 0.5 : 1,
                            left: 4,
                            right: undefined,
                          },
                        ]}
                      >
                        <ChevronRight
                          size={24}
                          color="#fff"
                          strokeWidth={2.5}
                        />
                      </Animated.View>
                    </GestureDetector>
                  </View>
                </>
              ) : null}

              {!showLoyaltyFlow &&
              !showWalletPaymentForm &&
              !needsRestaurantPick ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {t("payment.noBalanceData")}
                </Text>
              ) : null}
              {modalError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {modalError}
                </Text>
              ) : null}
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { opacity: isProcessing ? 0.5 : 1 },
                ]}
                onPress={isProcessing ? undefined : onClose}
                disabled={isProcessing}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <X size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>

        {/* Toast Component */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
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
            onClose();
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
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionTitleTight: {
    marginTop: 4,
    marginBottom: 6,
  },
  pickRestaurantHint: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  pickRestaurantEmpty: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  scanRestaurantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  scanRestaurantBtnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  scanRestaurantBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scanRestaurantBtnTextCompact: {
    fontSize: 14,
  },
  scanRestaurantHint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  selectedPaymentType: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  loyaltyPairRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  paymentOptions: {
    gap: 12,
    marginBottom: 24,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  paymentOptionHalf: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  walletOptionRow: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionLabelCompact: {
    fontSize: 13,
    fontWeight: "500",
  },
  optionBalanceCompact: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentMethodsSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  walletRestaurantConfirmCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 10,
    marginBottom: 10,
  },
  walletRestaurantConfirmLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  walletRestaurantConfirmName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 22,
  },
  walletRestaurantConfirmHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionBalance: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  voucherDetail: {
    fontSize: 14,
    marginBottom: 12,
  },
  voucherDetailTight: {
    marginBottom: 6,
    fontSize: 13,
  },
  walletSlidePrereqHint: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 17,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  slideContainer: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  slideContainerCompact: {
    height: 52,
    borderRadius: 26,
    marginVertical: 10,
  },
  slideHints: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  slideHintArrow: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  slideButtonArrow: {
    fontSize: 26,
    color: "white",
    fontWeight: "600",
  },
  slideButton: {
    position: "absolute",
    left: 4,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  slideButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  processingText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  centerLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loaderContainer: {
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
    textAlign: "center",
  },
  balancesLoaderCard: {
    marginTop: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 200,
    justifyContent: "center",
  },
  balancesLoaderText: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  balancePlaceholderRow: {
    width: "100%",
    marginTop: 20,
    gap: 8,
  },
  balancePlaceholderBar: {
    height: 12,
    borderRadius: 6,
    width: "100%",
    alignSelf: "center",
  },
  balancePlaceholderBarShort: {
    width: "72%",
    alignSelf: "center",
  },
  balancePlaceholderBarMedium: {
    width: "88%",
  },

  slideText: {
    fontSize: 16,
    fontWeight: "500",
  },

  cancelButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  walletAmountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    marginBottom: 4,
  },
  walletAmountInputCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 2,
  },
  walletPayButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  walletPayButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
