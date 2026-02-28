import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Text } from "@/components/AppText";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Coffee, UtensilsCrossed, ChevronRight } from "lucide-react-native";
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

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  /** Initial choice: meal or drink voucher only (no wallet). */
  initialPaymentType?: "drink" | "meal";
  restaurantId?: string;
}

export function PaymentModal({
  visible,
  onClose,
  initialPaymentType = "meal",
  restaurantId,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
  );
  const { refreshBalances, currentBalance } = useBalance();

  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "drink" | "meal"
  >(initialPaymentType);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "info",
  });

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

  const handleSlideConfirm = async () => {
    const targetRestaurantId = restaurantId || selectedRestaurant?.id;

    if (!targetRestaurantId) {
      showToast(t("payment.selectRestaurantFirst"), "error");
      return;
    }

    if (currentBalance.drinkPoints === 0 && currentBalance.mealPoints === 0) {
      showToast(t("payment.noBalanceData"), "error");
      return;
    }

    if (hasInsufficientBalance) {
      showToast(t("payment.insufficientBalance"), "error");
      return;
    }

    setIsProcessing(true);

    try {
      const currencyTypeMap = {
        meal: "stars_meal" as const,
        drink: "stars_drink" as const,
      };

      const paymentData = {
        targetId: targetRestaurantId,
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
          restaurantId: targetRestaurantId,
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
      showToast(error.message || "Payment failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const translateX = useSharedValue(0);

  // Swipe to pay: always left-to-right (LTR), regardless of app language/RTL
  const panGesture = Gesture.Pan()
    .enabled(!isProcessing)
    .onUpdate((event) => {
      const max = 220;
      const delta = Math.max(0, event.translationX);
      translateX.value = Math.min(delta, max);
    })
    .onEnd(() => {
      const threshold = 200;
      if (translateX.value > threshold) {
        runOnJS(handleSlideConfirm)();
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
      transparent={true}
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
                {t("payment.selectPaymentMethod")}
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("payment.currentBalance")} -{" "}
                {selectedRestaurant?.name || "المطعم المختار"}
              </Text>

              <Text
                style={[
                  styles.selectedPaymentType,
                  { color: colors.textSecondary },
                ]}
              >
                {t("payment.selectedMethod")}:{" "}
                {
                  paymentOptions.find((opt) => opt.type === selectedPaymentType)
                    ?.label
                }
              </Text>

              <View style={styles.paymentOptions}>
                {paymentOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedPaymentType === option.type;

                  return (
                    <TouchableOpacity
                      key={option.type}
                      style={[
                        styles.paymentOption,
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
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <IconComponent size={24} color={option.color} />
                      <View style={styles.optionContent}>
                        <Text
                          style={[styles.optionLabel, { color: colors.text }]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionBalance,
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
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Arrow hints: always LTR (left-to-right swipe) — use icon for correct display */}
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
                    <ChevronRight size={26} color="#fff" strokeWidth={2.5} />
                  </Animated.View>
                </GestureDetector>
              </View>

              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { opacity: isProcessing ? 0.5 : 1 },
                ]}
                onPress={isProcessing ? undefined : onClose}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>×</Text>
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
    padding: 24,
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 60,
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  selectedPaymentType: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
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

  slideText: {
    fontSize: 16,
    fontWeight: "500",
  },

  cancelButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
  },
  cancelButtonText: {
    fontSize: 24,
    fontWeight: "300",
    color: "white",
    lineHeight: 32,
    width: 32,
    textAlign: "center",
    ...(Platform.OS === "android" && { includeFontPadding: false }),
  },
});
