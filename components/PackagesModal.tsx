import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { X, CreditCard, Star, Package } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import api from "@/api/axiosInstance";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TopUpPackage {
  id: number;
  name: string;
  amount: number;
  bonus: number;
  currency: string;
  description: string;
  createdAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  logo: string;
}

interface PackagesResponse {
  success: boolean;
  message: string;
  data: {
    restaurant: Restaurant;
    packages: TopUpPackage[];
  };
}

interface PackagesModalProps {
  visible: boolean;
  onClose: () => void;
  restaurantId?: string;
}

export default function PackagesModal({
  visible,
  onClose,
  restaurantId,
}: PackagesModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<PackagesResponse>(
        `/ads/restaurant/${restaurantId}/packages`
      );

      if (response.data.success) {
        setPackages(response.data.data.packages);
        setRestaurant(response.data.data.restaurant);
      } else {
        setError(response.data.message || "فشل في جلب الباقات");
      }
    } catch (err: any) {
      console.error("Error fetching packages:", err);
      if (err.response) {
        // Server responded with error
        setError(err.response.data?.message || "حدث خطأ في جلب الباقات");
      } else if (err.request) {
        // No response received
        setError("حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى");
      } else {
        setError("حدث خطأ غير متوقع");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && restaurantId) {
      fetchPackages();
    }
  }, [visible, restaurantId]);

  const handlePackageSelect = (selectedPackage: TopUpPackage) => {
    Alert.alert(
      "تأكيد الشراء",
      `هل تريد شراء باقة "${selectedPackage.name}" بقيمة ${selectedPackage.amount} ${selectedPackage.currency}؟`,
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "شراء",
          onPress: () => {
            // هنا يمكنك إضافة منطق الدفع (PayPal, Stripe, etc.)
            console.log("Selected package:", selectedPackage);
            Alert.alert("قريباً", "سيتم تفعيل عملية الدفع قريباً");
            onClose();
          },
        },
      ]
    );
  };

  const handleRetry = () => {
    fetchPackages();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Package size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {restaurant?.name ? `باقات ${restaurant.name}` : "باقات الشحن"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.loadingText, { color: colors.textSecondary }]}
                >
                  جاري تحميل الباقات...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorTitle, { color: colors.error }]}>
                  خطأ في تحميل الباقات
                </Text>
                <Text
                  style={[styles.errorMessage, { color: colors.textSecondary }]}
                >
                  {error}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Package size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  لا توجد باقات متاحة
                </Text>
                <Text
                  style={[styles.emptyMessage, { color: colors.textSecondary }]}
                >
                  لا يوجد باقات شحن متاحة لهذا المطعم حالياً
                </Text>
              </View>
            ) : (
              <View style={styles.packagesContainer}>
                {packages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => handlePackageSelect(pkg)}
                  >
                    <View style={styles.packageHeader}>
                      <View style={styles.packageInfo}>
                        <Text
                          style={[styles.packageName, { color: colors.text }]}
                        >
                          {pkg.name}
                        </Text>
                        {pkg.description && (
                          <Text
                            style={[
                              styles.packageDescription,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {pkg.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.packagePricing}>
                        <Text
                          style={[
                            styles.packageAmount,
                            { color: colors.primary },
                          ]}
                        >
                          {pkg.amount} {pkg.currency}
                        </Text>
                        {pkg.bonus > 0 && (
                          <View style={styles.bonusContainer}>
                            <Star size={14} color={colors.secondary} />
                            <Text
                              style={[
                                styles.bonusText,
                                { color: colors.secondary },
                              ]}
                            >
                              +{pkg.bonus} مكافأة
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.packageFooter}>
                      <View
                        style={[
                          styles.selectButton,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <CreditCard size={16} color="white" />
                        <Text style={styles.selectButtonText}>اختيار</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    // paddingBottom will be set dynamically via style prop
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  packagesContainer: {
    gap: 16,
  },
  packageCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
    marginRight: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  packagePricing: {
    alignItems: "flex-end",
  },
  packageAmount: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bonusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  packageFooter: {
    alignItems: "flex-end",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  selectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
