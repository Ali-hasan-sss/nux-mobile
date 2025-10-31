import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { X, Check, Crown, ArrowLeft } from "lucide-react-native";
import {
  fetchPlans,
  createCheckoutSession,
  confirmSubscription,
} from "@/store/slices/plansSlice";
import { Plan } from "@/store/types/plansTypes";
import RenderHTML from "react-native-render-html";
import { WebView } from "react-native-webview";

interface UpgradePlanModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();

  const { plans, loading, checkoutLoading, error } = useSelector(
    (state: RootState) => state.plans
  );

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch plans when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(fetchPlans());
      setCheckoutUrl(null);
      setSessionId(null);
      setSelectedPlanId(null);
    }
  }, [visible, dispatch]);

  const handleSubscribe = async (planId: number) => {
    // Skip if it's free plan
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    if (plan.price === 0 || plan.title.toLowerCase().includes("free")) {
      Alert.alert(t("common.error"), t("restaurant.cannotSubscribeFree"));
      return;
    }

    setSelectedPlanId(planId);

    try {
      const result = await dispatch(createCheckoutSession(planId));

      if (createCheckoutSession.fulfilled.match(result)) {
        const { url, id } = result.payload;

        // Open Stripe checkout in WebView
        setCheckoutUrl(url);
        setSessionId(id);
      } else {
        Alert.alert(
          t("common.error"),
          (result.payload as string) || "Failed to create checkout session"
        );
        setSelectedPlanId(null);
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || "Failed to subscribe");
      setSelectedPlanId(null);
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log("📍 WebView URL:", url);

    // Check if redirected to success URL
    if (
      url.includes("/dashboard/subscription?status=success") ||
      url.includes("status=success")
    ) {
      // Extract session_id from URL
      const urlObj = new URL(url);
      const urlSessionId = urlObj.searchParams.get("session_id");
      const finalSessionId = urlSessionId || sessionId;

      if (finalSessionId && !isProcessingPayment) {
        setIsProcessingPayment(true);
        setCheckoutUrl(null);

        try {
          const result = await dispatch(confirmSubscription(finalSessionId));

          if (confirmSubscription.fulfilled.match(result)) {
            Alert.alert(
              t("common.success"),
              t("restaurant.subscriptionActivated"),
              [
                {
                  text: t("common.close"),
                  onPress: () => {
                    setIsProcessingPayment(false);
                    setSelectedPlanId(null);
                    setSessionId(null);
                    onClose();
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              t("common.error"),
              (result.payload as string) || "Failed to confirm subscription"
            );
            setIsProcessingPayment(false);
          }
        } catch (error: any) {
          Alert.alert(t("common.error"), error.message || "Failed to confirm");
          setIsProcessingPayment(false);
        }
      }
    }

    // Check if cancelled
    if (url.includes("status=cancel")) {
      setCheckoutUrl(null);
      setSelectedPlanId(null);
      setSessionId(null);
      Alert.alert(t("common.error"), t("restaurant.paymentCancelled"));
    }
  };

  const handleCloseWebView = () => {
    setCheckoutUrl(null);
    setSelectedPlanId(null);
    setSessionId(null);
  };

  const renderPlan = (plan: Plan) => {
    const isFree =
      plan.price === 0 || plan.title.toLowerCase().includes("free");
    const isSelecting = selectedPlanId === plan.id;

    return (
      <View
        key={plan.id}
        style={[styles.planCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, { color: colors.text }]}>
            {plan.title}
          </Text>
          {!isFree && <Crown size={20} color={colors.primary} />}
        </View>

        {/* Render HTML description */}
        <View style={styles.descriptionContainer}>
          <RenderHTML
            contentWidth={width - 80}
            source={{ html: plan.description || "" }}
            baseStyle={{
              color: colors.textSecondary,
              fontSize: 14,
              lineHeight: 20,
            }}
          />
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text }]}>
            {plan.currency === "EUR" ? "€" : "$"}
            {plan.price.toFixed(2)}
          </Text>
          <Text style={[styles.duration, { color: colors.textSecondary }]}>
            / {plan.duration} {t("restaurant.days")}
          </Text>
        </View>

        {/* Permissions */}
        <View style={styles.permissionsContainer}>
          {plan.permissions.slice(0, 5).map((permission) => (
            <View key={permission.id} style={styles.permissionItem}>
              <Check size={16} color={colors.success} />
              <Text
                style={[styles.permissionText, { color: colors.textSecondary }]}
              >
                {permission.type.replace(/_/g, " ")}
                {permission.isUnlimited
                  ? ` (${t("restaurant.unlimited")})`
                  : permission.value
                  ? ` (${permission.value})`
                  : ""}
              </Text>
            </View>
          ))}
          {plan.permissions.length > 5 && (
            <Text
              style={[styles.morePermissions, { color: colors.textSecondary }]}
            >
              +{plan.permissions.length - 5} {t("restaurant.moreFeatures")}
            </Text>
          )}
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            {
              backgroundColor: isFree ? colors.textSecondary : colors.primary,
              opacity: isSelecting ? 0.7 : 1,
            },
          ]}
          onPress={() => handleSubscribe(plan.id)}
          disabled={isFree || isSelecting || checkoutLoading}
        >
          {isSelecting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {isFree ? t("restaurant.currentPlan") : t("restaurant.subscribe")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Show WebView if checkout URL is set
  if (checkoutUrl) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleCloseWebView}
      >
        <View style={styles.webViewContainer}>
          <View
            style={[styles.webViewHeader, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              onPress={handleCloseWebView}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: colors.text }]}>
              {t("restaurant.completePayment")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {isProcessingPayment ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.processingText, { color: colors.textSecondary }]}
              >
                {t("restaurant.processingPayment")}...
              </Text>
            </View>
          ) : (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              style={styles.webView}
            />
          )}
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border || "#E5E7EB" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("restaurant.upgradePlan")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                {t("restaurant.loadingPlans")}...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => dispatch(fetchPlans())}
              >
                <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.plansList}
              showsVerticalScrollIndicator={false}
            >
              {plans.map((plan) => renderPlan(plan))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  plansList: {
    padding: 20,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
  },
  duration: {
    fontSize: 14,
    marginLeft: 8,
  },
  permissionsContainer: {
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    flex: 1,
  },
  morePermissions: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  subscribeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  webView: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
