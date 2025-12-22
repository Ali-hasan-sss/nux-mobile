import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { WebView } from "react-native-webview";

// Website base URL - adjust this to your production URL
// In development, use localhost (or 10.0.2.2 for Android Emulator)
// In production, use the production URL with www
const WEBSITE_BASE_URL = "https://www.nuxapp.de"; // Production URL with www

export default function MenuWebViewScreen() {
  const params = useLocalSearchParams<{ qrCode: string | string[] }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Extract UUID from QR code (handle both UUID and full URL formats)
  const extractQRCode = (
    input: string | string[] | undefined
  ): string | null => {
    if (!input) return null;

    const code = Array.isArray(input) ? input[0] : input;
    if (!code) return null;

    // If it's already a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(code.trim())) {
      return code.trim();
    }

    // If it's a URL, extract the UUID from the path
    // Examples:
    // - https://www.nuxapp.de/menu/a97d0d39-658a-4370-8b4b-78667bd3df80
    // - http://localhost:3000/menu/a97d0d39-658a-4370-8b4b-78667bd3df80
    // - /menu/a97d0d39-658a-4370-8b4b-78667bd3df80
    const urlMatch = code.match(
      /\/menu\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    // If no match found, return the original code (might be a different format)
    console.warn("⚠️ Could not extract UUID from QR code:", code);
    return code.trim();
  };

  const qrCode = extractQRCode(params.qrCode);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0); // Key to force WebView reload

  // Keep tab bar visible - don't hide it

  // Construct the menu URL
  const menuUrl = qrCode ? `${WEBSITE_BASE_URL}/menu/${qrCode}` : null;

  // Log the URL for debugging
  React.useEffect(() => {
    if (menuUrl) {
      console.log("🌐 Menu WebView URL:", menuUrl);
      console.log("🌐 Base URL:", WEBSITE_BASE_URL);
      console.log("🌐 Extracted QR Code (UUID):", qrCode);
      console.log("🌐 Original QR Code:", params.qrCode);
      console.log("🌐 Platform:", Platform.OS);
      console.log("🌐 Dev Mode:", __DEV__);
    }
  }, [menuUrl, qrCode, params.qrCode]);

  // Timeout for loading state to prevent infinite loading
  React.useEffect(() => {
    if (loading && menuUrl) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Loading timeout - hiding loader");
        setLoading(false);
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, menuUrl]);

  const handleWebViewLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("❌ WebView error:", nativeEvent);
    console.error("❌ Error code:", nativeEvent.code);
    console.error("❌ Error description:", nativeEvent.description);
    console.error("❌ Failed URL:", menuUrl);
    setLoading(false);
    setError(
      nativeEvent.description ||
        t("menu.errorLoadingMenu") ||
        "Failed to load menu"
    );
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("❌ HTTP Error:", nativeEvent.statusCode);
    console.error("❌ Failed URL:", menuUrl);
    if (nativeEvent.statusCode >= 400) {
      setLoading(false);
      setError(
        `Failed to load menu (Error ${nativeEvent.statusCode}). Please check your internet connection.`
      );
    }
  };

  if (!menuUrl) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t("menu.invalidQRCode") || "Invalid QR code"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("menu.loadingMenu") || "Loading menu"}...
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              console.log("🔄 Retrying to load menu URL:", menuUrl);
              setError(null);
              setLoading(true);
              setWebViewKey((prev) => prev + 1); // Force WebView reload
            }}
          >
            <Text style={styles.retryButtonText}>
              {t("home.retry") || "Retry"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!error && menuUrl && (
        <WebView
          key={webViewKey} // Force reload when key changes
          source={{ uri: menuUrl }}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          onLoadStart={() => {
            console.log("🔄 WebView: Loading started for URL:", menuUrl);
            setLoading(true);
            setError(null);
          }}
          onLoadEnd={() => {
            console.log("✅ WebView: Loading ended for URL:", menuUrl);
            setLoading(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    marginBottom: 80, // Add margin to account for tab bar
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 80, // Account for tab bar height
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
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
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
