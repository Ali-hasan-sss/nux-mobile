import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Coffee,
  UtensilsCrossed,
  Wallet,
  ArrowRight,
  X,
} from "lucide-react-native";
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
  initialPaymentType?: "drink" | "meal" | "wallet";
  restaurantId?: string;
}

export function PaymentModal({
  visible,
  onClose,
  initialPaymentType = "wallet",
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
    "drink" | "meal" | "wallet"
  >(initialPaymentType);
  const [amount, setAmount] = useState("");
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

  // Use current balance from useBalance hook (real-time data)
  // currentBalance is already available from useBalance hook

  // Debug: Log current balance for the selected restaurant
  React.useEffect(() => {
    if (restaurantId || selectedRestaurant?.id) {
      console.log(
        "🏪 PaymentModal - Restaurant ID:",
        restaurantId || selectedRestaurant?.id
      );
      console.log("💰 PaymentModal - Current Balance:", currentBalance);
      console.log(
        "💳 PaymentModal - Selected Payment Type:",
        selectedPaymentType
      );
    }
  }, [
    restaurantId,
    selectedRestaurant?.id,
    currentBalance,
    selectedPaymentType,
  ]);

  // Reset form when modal opens (but preserve payment type selection)
  React.useEffect(() => {
    if (visible) {
      setAmount("");
      // Refresh balances when modal opens to ensure we have latest data
      refreshBalances();
      console.log(
        "🔄 Modal opened, resetting amount but preserving payment type"
      );
      // Reset slider position on open
      translateX.value = 0;
    }
  }, [visible]); // Remove refreshBalances from dependencies to prevent re-triggering

  // Only set initial payment type when modal first opens, not on every render
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

  const paymentOptions = [
    {
      type: "wallet" as const,
      label: t("purchase.walletBalance"),
      icon: Wallet,
      balance: currentBalance.walletBalance,
      color: colors.success,
      prefix: "$",
    },
    {
      type: "drink" as const,
      label: t("purchase.drinkPoints"),
      icon: Coffee,
      balance: currentBalance.drinkPoints,
      color: colors.secondary,
      prefix: "",
    },
    {
      type: "meal" as const,
      label: t("purchase.mealPoints"),
      icon: UtensilsCrossed,
      balance: currentBalance.mealPoints,
      color: colors.primary,
      prefix: "",
    },
  ];

  const selectedOption = paymentOptions.find(
    (option) => option.type === selectedPaymentType
  );
  const numericAmount = parseFloat(amount) || 0;
  const hasInsufficientBalance = numericAmount > (selectedOption?.balance || 0);

  const handleSlideConfirm = async () => {
    const targetRestaurantId = restaurantId || selectedRestaurant?.id;

    if (!targetRestaurantId) {
      showToast(t("payment.selectRestaurantFirst"), "error");
      return;
    }

    // Check if we have valid balance data
    if (
      currentBalance.walletBalance === 0 &&
      currentBalance.drinkPoints === 0 &&
      currentBalance.mealPoints === 0
    ) {
      showToast(t("payment.noBalanceData"), "error");
      return;
    }

    // منع إعادة السحب إذا لم يتم إدخال قيمة صحيحة
    if (!amount || numericAmount <= 0) {
      showToast(t("payment.enterValidAmount"), "error");
      return;
    }

    if (hasInsufficientBalance) {
      showToast(t("payment.insufficientBalance"), "error");
      return;
    }

    // Start processing
    setIsProcessing(true);

    try {
      // تنفيذ الدفع باستخدام processPayment
      const currencyTypeMap = {
        wallet: "balance" as const,
        meal: "stars_meal" as const,
        drink: "stars_drink" as const,
      };

      const paymentData = {
        targetId: targetRestaurantId,
        amount: numericAmount,
        currencyType: currencyTypeMap[selectedPaymentType],
      };

      console.log("💳 Processing payment:", paymentData);

      const result = await dispatch(processPayment(paymentData) as any);
      if (result.type.endsWith("/rejected")) {
        throw new Error((result.payload as string) || "Payment failed");
      }

      // تحديث الأرصدة بعد نجاح الدفع
      refreshBalances();

      // تحديث المطعم المحدد في restaurantSlice
      const newBalance = (selectedOption?.balance || 0) - numericAmount;
      dispatch(
        updateRestaurantBalance({
          restaurantId: targetRestaurantId,
          balanceType:
            selectedPaymentType === "wallet"
              ? "walletBalance"
              : selectedPaymentType === "meal"
              ? "mealPoints"
              : "drinkPoints",
          amount: newBalance,
        })
      );

      // Show success toast
      showToast(t("payment.paymentSuccessful"), "success");

      // إعادة الحالة
      translateX.value = 0;
      setAmount("");

      // Close modal after a short delay to show the toast
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

  const panGesture = Gesture.Pan()
    .enabled(!isProcessing)
    .onUpdate((event) => {
      const max = 220;
      if (I18nManager.isRTL) {
        // Drag to left (negative). Clamp to [-max, 0]
        const delta = Math.min(0, event.translationX);
        const magnitude = Math.min(Math.abs(delta), max);
        translateX.value = -magnitude;
      } else {
        // Drag to right (positive). Clamp to [0, max]
        const delta = Math.max(0, event.translationX);
        translateX.value = Math.min(delta, max);
      }
    })
    .onEnd(() => {
      const threshold = 200;
      const passed = I18nManager.isRTL
        ? Math.abs(translateX.value) > threshold
        : translateX.value > threshold;
      if (passed) {
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
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                          console.log(
                            "🔄 Changing payment type to:",
                            option.type
                          );
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
                          {option.prefix}
                          {option.balance}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("payment.paymentAmount")}
              </Text>

              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: hasInsufficientBalance
                      ? colors.error
                      : colors.border,
                    opacity: isProcessing ? 0.5 : 1,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!isProcessing}
              />

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
                {/* أسهم الخلفية كدلالة سحب */}
                <View style={styles.slideHints}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ArrowRight
                      key={index}
                      size={18}
                      color={colors.textSecondary}
                      style={{
                        marginHorizontal: 4,
                        transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
                      }}
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
                        // Anchor start position per direction
                        ...(I18nManager.isRTL
                          ? { right: 4, left: undefined }
                          : { left: 4, right: undefined }),
                      },
                    ]}
                  >
                    <ArrowRight
                      size={24}
                      color="white"
                      style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}
                    />
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
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  <X size={24} color="white" />
                </Text>
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
  amountInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    textAlign: "center",
    borderWidth: 1,
    marginBottom: 8,
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
    fontSize: 22,
    fontWeight: "bold",
  },
});
