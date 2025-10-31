import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useRestaurantQR } from "@/hooks/useRestaurantQR";
import QRCode from "react-native-qrcode-svg";
import {
  Coffee,
  UtensilsCrossed,
  RefreshCw,
  Printer,
  Menu,
} from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const RestaurantQRCodes: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    restaurantInfo: info,
    loading,
    error,
    autoRefreshEnabled,
    loadRestaurantInfo,
    regenerateQR,
    toggleAutoRefresh,
  } = useRestaurantQR();

  // Menu URL for QR code
  const WEB_BASE_URL = "https://nuxapp.de";
  const menuUrl = info?.id ? `${WEB_BASE_URL}/menu/${info.id}` : "";

  const [refreshing, setRefreshing] = useState(false);
  const autoRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    // Fetch restaurant info on mount
    loadRestaurantInfo();
  }, [loadRestaurantInfo]);

  // Auto-refresh QR codes every 5 minutes if enabled
  useEffect(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }

    if (autoRefreshEnabled) {
      autoRefreshInterval.current = setInterval(() => {
        console.log("🔄 Auto-refreshing QR codes...");
        regenerateQR();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [autoRefreshEnabled, regenerateQR]);

  const handleRegenerate = async () => {
    Alert.alert(t("common.confirm"), t("restaurant.confirmRegenerate"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        onPress: async () => {
          setRefreshing(true);
          await regenerateQR();
          setRefreshing(false);
          Alert.alert(t("common.success"), t("restaurant.regenerateSuccess"));
        },
      },
    ]);
  };

  const handleToggleAutoRefresh = (enabled: boolean) => {
    toggleAutoRefresh(enabled);
    if (enabled) {
      Alert.alert(
        t("restaurant.autoRefreshOn"),
        t("restaurant.autoRefreshOnDesc")
      );
    } else {
      Alert.alert(
        t("restaurant.autoRefreshOff"),
        t("restaurant.autoRefreshOffDesc")
      );
    }
  };

  const generateQRHTML = (
    title: string,
    qrCode: string,
    type: "drink" | "meal" | "menu"
  ) => {
    const emoji = type === "drink" ? "☕" : type === "meal" ? "🍽️" : "📋";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              border: 2px solid #333;
              border-radius: 16px;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              color: #333;
            }
            .subtitle {
              font-size: 18px;
              color: #666;
              margin-bottom: 30px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${info?.name || "Restaurant"}</h1>
            <div class="subtitle">${emoji} ${title}</div>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                qrCode
              )}" width="300" height="300" />
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintQR = async (
    title: string,
    qrCode: string,
    type: "drink" | "meal" | "menu"
  ) => {
    try {
      const html = generateQRHTML(title, qrCode, type);

      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        // For mobile
        const { uri } = await Print.printToFileAsync({ html });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `${title} QR Code`,
          });
        } else {
          Alert.alert(t("common.error"), t("restaurant.sharingNotAvailable"));
        }
      }
    } catch (error) {
      console.error("Error printing QR:", error);
      Alert.alert(t("common.error"), t("restaurant.printFailed"));
    }
  };

  if (loading && !info) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t("restaurant.loadingRestaurant")}
        </Text>
      </View>
    );
  }

  if (error && !info) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadRestaurantInfo}
        >
          <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!info) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>
          {info.name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("restaurant.qrCodes")}
        </Text>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: colors.surface }]}>
        <View style={styles.autoRefreshRow}>
          <View style={styles.autoRefreshInfo}>
            <Text style={[styles.autoRefreshLabel, { color: colors.text }]}>
              {t("restaurant.autoRefresh")}
            </Text>
            <Text
              style={[styles.autoRefreshDesc, { color: colors.textSecondary }]}
            >
              {autoRefreshEnabled
                ? t("restaurant.autoRefreshEnabled")
                : t("restaurant.autoRefreshDisabled")}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.switchButton,
              {
                backgroundColor: autoRefreshEnabled
                  ? colors.success
                  : colors.textSecondary + "40",
              },
            ]}
            onPress={() => handleToggleAutoRefresh(!autoRefreshEnabled)}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: "white",
                  transform: [{ translateX: autoRefreshEnabled ? 20 : 0 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.regenerateButton, { backgroundColor: colors.primary }]}
          onPress={handleRegenerate}
          disabled={refreshing}
        >
          <RefreshCw
            size={20}
            color="white"
            style={{ opacity: refreshing ? 0.5 : 1 }}
          />
          <Text style={styles.regenerateButtonText}>
            {refreshing
              ? t("restaurant.regenerating")
              : t("restaurant.regenerateCodes")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Codes */}
      <View style={styles.qrCodesContainer}>
        {/* Drink QR */}
        <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
          <View style={styles.qrCardHeader}>
            <Coffee size={28} color={colors.secondary} />
            <Text style={[styles.qrCardTitle, { color: colors.text }]}>
              {t("restaurant.drinkQRCode")}
            </Text>
          </View>

          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={info.qrCode_drink}
              size={200}
              color={colors.text}
              backgroundColor={colors.background}
            />
          </View>

          <TouchableOpacity
            style={[styles.printButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              handlePrintQR(
                t("restaurant.drinksCode"),
                info.qrCode_drink,
                "drink"
              )
            }
          >
            <Printer size={18} color="white" />
            <Text style={styles.printButtonText}>{t("restaurant.print")}</Text>
          </TouchableOpacity>
        </View>

        {/* Meal QR */}
        <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
          <View style={styles.qrCardHeader}>
            <UtensilsCrossed size={28} color={colors.primary} />
            <Text style={[styles.qrCardTitle, { color: colors.text }]}>
              {t("restaurant.mealQRCode")}
            </Text>
          </View>

          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={info.qrCode_meal}
              size={200}
              color={colors.text}
              backgroundColor={colors.background}
            />
          </View>

          <TouchableOpacity
            style={[styles.printButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              handlePrintQR(t("restaurant.mealsCode"), info.qrCode_meal, "meal")
            }
          >
            <Printer size={18} color="white" />
            <Text style={styles.printButtonText}>{t("restaurant.print")}</Text>
          </TouchableOpacity>
        </View>

        {/* Menu QR */}
        {menuUrl && (
          <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
            <View style={styles.qrCardHeader}>
              <Menu size={28} color={colors.success} />
              <View style={styles.qrCardTitleContainer}>
                <Text style={[styles.qrCardTitle, { color: colors.text }]}>
                  {t("restaurant.menuQRCode")}
                </Text>
                <Text
                  style={[styles.qrCardDesc, { color: colors.textSecondary }]}
                >
                  {t("restaurant.scanForMenu")}
                </Text>
              </View>
            </View>

            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={menuUrl}
                size={200}
                color={colors.text}
                backgroundColor={colors.background}
              />
            </View>

            <Text style={[styles.menuUrlText, { color: colors.textSecondary }]}>
              {menuUrl}
            </Text>

            <TouchableOpacity
              style={[styles.printButton, { backgroundColor: colors.success }]}
              onPress={() =>
                handlePrintQR(t("restaurant.menuCode"), menuUrl, "menu")
              }
            >
              <Printer size={18} color="white" />
              <Text style={styles.printButtonText}>
                {t("restaurant.print")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
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
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  controls: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
  },
  autoRefreshRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autoRefreshInfo: {
    flex: 1,
  },
  autoRefreshLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  autoRefreshDesc: {
    fontSize: 14,
  },
  switchButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  qrCodesContainer: {
    gap: 20,
  },
  qrCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  qrCardTitleContainer: {
    flex: 1,
  },
  qrCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  qrCardDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  qrCodeWrapper: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 20,
  },
  printButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  printButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  menuUrlText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
