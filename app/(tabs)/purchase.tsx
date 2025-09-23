import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { generateQRCode } from "@/store/slices/userSlice";
import { useBalance } from "@/hooks/useBalance";
import { useFocusEffect } from "expo-router";
import {
  CreditCard,
  Gift,
  Camera,
  Image as ImageIcon,
  Coffee,
  UtensilsCrossed,
  Wallet,
  Clock,
  Star,
} from "lucide-react-native";
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

interface ScanRecord {
  id: string;
  timestamp: string;
  pointsConsumed: number;
  type: "meal" | "drink";
}

const mockScanRecords: ScanRecord[] = [
  {
    id: "1",
    timestamp: "2025-01-15 14:30",
    pointsConsumed: 50,
    type: "meal",
  },
  {
    id: "2",
    timestamp: "2025-01-15 10:15",
    pointsConsumed: 50,
    type: "drink",
  },
  {
    id: "3",
    timestamp: "2025-01-14 16:45",
    pointsConsumed: 50,
    type: "meal",
  },
  {
    id: "4",
    timestamp: "2025-01-14 12:20",
    pointsConsumed: 100,
    type: "drink",
  },
];
export default function PurchaseScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
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
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [selectedGiftType, setSelectedGiftType] = useState<
    "wallet" | "drink" | "meal"
  >("wallet");
  const [giftAmount, setGiftAmount] = useState("");

  const isRestaurant = auth.user?.role === "RESTAURANT_OWNER";

  // Fetch user balances every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (auth.isAuthenticated) {
        console.log("🔄 Refreshing balances on purchase screen focus");
        loadBalances();
      }
    }, [auth.isAuthenticated])
  );

  React.useEffect(() => {
    // Generate QR code when component mounts
    const qrData = JSON.stringify({
      userId: auth.user?.id,
      email: auth.user?.email,
    });
    dispatch(generateQRCode(qrData));
  }, [auth.user, dispatch]);

  const handleRecharge = () => {
    if (!selectedRestaurant) {
      Alert.alert(t("common.error"), "Please select a restaurant first");
      return;
    }
    // Handle PayPal integration for wallet recharge
    console.log("Initiating PayPal recharge...");
  };

  const handleGiftFriend = () => {
    if (!selectedRestaurant) {
      Alert.alert(t("common.error"), "Please select a restaurant first");
      return;
    }
    setGiftModalVisible(true);
  };

  const handleScanForGift = () => {
    setGiftModalVisible(false);
    router.push("/camera/gift-scan");
  };

  const handleUploadImage = () => {
    // Handle image upload for QR code
  };

  const sendGift = () => {
    if (!selectedRestaurant) {
      Alert.alert(t("common.error"), "Please select a restaurant first");
      return;
    }
    // Handle sending gift
    setGiftModalVisible(false);
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

  const renderScanRecord = ({ item }: { item: ScanRecord }) => (
    <View style={[styles.scanRecord, { backgroundColor: colors.surface }]}>
      <View style={styles.scanRecordHeader}>
        <View style={styles.scanRecordIcon}>
          {item.type === "meal" ? (
            <UtensilsCrossed size={20} color={colors.primary} />
          ) : (
            <Coffee size={20} color={colors.secondary} />
          )}
        </View>
        <View style={styles.scanRecordInfo}>
          <Text style={[styles.scanRecordType, { color: colors.text }]}>
            {item.type === "meal"
              ? t("promotions.food")
              : t("promotions.drinks")}
          </Text>
          <View style={styles.scanRecordDetails}>
            <Clock size={14} color={colors.textSecondary} />
            <Text
              style={[styles.scanRecordTime, { color: colors.textSecondary }]}
            >
              {item.timestamp}
            </Text>
          </View>
        </View>
        <View style={styles.scanRecordPoints}>
          <Text style={[styles.pointsConsumed, { color: colors.error }]}>
            -{item.pointsConsumed}
          </Text>
          <Star size={16} color={colors.error} />
        </View>
      </View>
    </View>
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isRestaurant ? t("restaurant.scans") : t("purchase.title")}
        </Text>
      </View>

      {!isRestaurant && (
        <>
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
                خطأ في تحميل البيانات
              </Text>
              <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
                {error.balances}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.error }]}
                onPress={loadBalances}
              >
                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
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
                style={[styles.noBalanceDesc, { color: colors.textSecondary }]}
              >
                {t("home.noBalancesDesc")}
              </Text>
            </View>
          )}
        </>
      )}

      {!isRestaurant && selectedRestaurant && (
        <View style={styles.balanceSection}>
          <View style={styles.balanceRow}>
            <View
              style={[styles.balanceCard, { backgroundColor: colors.surface }]}
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
                style={[styles.balanceLabel, { color: colors.textSecondary }]}
              >
                {t("purchase.mealPoints")}
              </Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {currentBalance.mealPoints}
              </Text>
            </View>

            <View
              style={[styles.balanceCard, { backgroundColor: colors.surface }]}
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
                style={[styles.balanceLabel, { color: colors.textSecondary }]}
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
                style={[styles.balanceLabel, { color: colors.textSecondary }]}
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {isRestaurant ? (
          <View style={styles.scansList}>
            <Text style={[styles.scansTitle, { color: colors.text }]}>
              {t("restaurant.recentScans")}
            </Text>
            <FlatList
              data={mockScanRecords}
              renderItem={renderScanRecord}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        ) : (
          <>
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
              <View
                style={[styles.qrCard, { backgroundColor: colors.surface }]}
              >
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
                  {auth.user ? (
                    <QRCode
                      value={JSON.stringify({
                        userId: auth.user.id,
                        email: auth.user.email,
                      })}
                      size={200}
                      color={colors.text}
                      backgroundColor={colors.background}
                    />
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
                        QR Code
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {!isRestaurant && (
        <Modal
          visible={giftModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setGiftModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t("purchase.giftOptions")}
              </Text>

              <View style={styles.giftTypeContainer}>
                {[
                  { type: "wallet", label: t("purchase.walletBalance") },
                  { type: "drink", label: t("purchase.drinkPoints") },
                  { type: "meal", label: t("purchase.mealPoints") },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.giftTypeButton,
                      {
                        backgroundColor:
                          selectedGiftType === option.type
                            ? colors.primary
                            : colors.background,
                      },
                    ]}
                    onPress={() => setSelectedGiftType(option.type as any)}
                  >
                    <Text
                      style={[
                        styles.giftTypeText,
                        {
                          color:
                            selectedGiftType === option.type
                              ? "white"
                              : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.amountInput,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                placeholder={t("purchase.amount")}
                placeholderTextColor={colors.textSecondary}
                value={giftAmount}
                onChangeText={setGiftAmount}
                keyboardType="numeric"
              />

              <Text style={[styles.scanTitle, { color: colors.text }]}>
                {t("purchase.scanOrUpload")}
              </Text>

              <View style={styles.scanOptions}>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleScanForGift}
                >
                  <Camera size={20} color="white" />
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleUploadImage}
                >
                  <ImageIcon size={20} color="white" />
                  <Text style={styles.scanButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.border },
                  ]}
                  onPress={() => setGiftModalVisible(false)}
                >
                  <Text
                    style={[styles.modalButtonText, { color: colors.text }]}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={sendGift}
                >
                  <Text style={styles.modalButtonText}>
                    {t("purchase.send")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
    padding: 20,
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
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCard: {
    borderRadius: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
    elevation: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  giftTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  giftTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  giftTypeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  amountInput: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  scanOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  scanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
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
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
