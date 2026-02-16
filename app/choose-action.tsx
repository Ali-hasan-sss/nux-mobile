import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Modal, Pressable } from "react-native";
import { Text } from "@/components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { router, Redirect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { UserPlus, LogIn, Globe, Sun, Moon, Monitor } from "lucide-react-native";
import { RootState, AppDispatch } from "@/store/store";
import { setLanguage } from "@/store/slices/languageSlice";
import { setTheme } from "@/store/slices/themeSlice";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

type ThemeMode = "light" | "dark" | "system";
const THEME_CYCLE: ThemeMode[] = ["system", "light", "dark"];

export default function ChooseActionScreen() {
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { colors, mode } = useTheme();
  const isRTL = i18n.language === "ar";
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const currentLanguage = useSelector(
    (state: RootState) => state.language.currentLanguage
  );
  const insets = useSafeAreaInsets();

  const handleLanguageChange = async (language: string) => {
    dispatch(setLanguage(language));
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem("user-language", language);
    setLanguageModalVisible(false);
  };

  const cycleTheme = () => {
    const idx = THEME_CYCLE.indexOf(mode as ThemeMode);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    dispatch(setTheme(next));
  };

  const ThemeIcon =
    mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  const themeIconSize = 24;

  useEffect(() => {
    // If user is authenticated, redirect to tabs
    if (isAuthenticated) {
      router.replace("/(tabs)");
      return;
    }

    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isAuthenticated]);

  const handleRegister = () => {
    router.replace("/auth/register");
  };

  const handleLogin = () => {
    router.replace("/auth/login");
  };

  // If user is authenticated, redirect to tabs
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: "transparent",
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={[styles.topBarRow, isRTL && styles.topBarRowRTL]}>
          <TouchableOpacity
            onPress={() => setLanguageModalVisible(true)}
            style={[styles.iconButton, { backgroundColor: colors.surface + "99" }]}
            activeOpacity={0.7}
          >
            <Globe size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={cycleTheme}
            style={[styles.iconButton, { backgroundColor: colors.surface + "99" }]}
            activeOpacity={0.7}
          >
            <ThemeIcon size={themeIconSize} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.languageModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.languageModalTitle, { color: colors.text }]}>
              {t("chooseAction.selectLanguage") || "Select Language"}
            </Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && {
                    backgroundColor: colors.primary + "30",
                  },
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    {
                      color:
                        currentLanguage === lang.code
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.languageModalClose, { borderTopColor: colors.border }]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={[styles.languageModalCloseText, { color: colors.primary }]}>
                {t("common.close") || "Close"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, SCREEN_WIDTH],
                  outputRange: isRTL ? [0, -SCREEN_WIDTH] : [0, SCREEN_WIDTH],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.text }]}>
          {t("chooseAction.title") || "Get Started"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("chooseAction.subtitle") || "Choose an option to continue"}
        </Text>

        {/* Register Button */}
        <View style={styles.buttonContainer}>
          {(colors as any).gradientButton ? (
            <LinearGradient
              colors={
                (colors as any).gradientButton || [
                  colors.primary,
                  colors.primary,
                ]
              }
              style={styles.actionButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.actionButtonInner}
                onPress={handleRegister}
              >
                <UserPlus size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  {t("chooseAction.createAccount") || "Create Account"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
            >
              <UserPlus size={24} color="white" />
              <Text style={styles.actionButtonText}>
                {t("chooseAction.createAccount") || "Create Account"}
              </Text>
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.buttonDescription,
              {
                color: colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("chooseAction.createAccountDescription") ||
              "If you're new, create an account to get started"}
          </Text>
        </View>

        {/* Login Button */}
        <View style={styles.buttonContainer}>
          {(colors as any).gradientButton ? (
            <LinearGradient
              colors={
                (colors as any).gradientButton || [
                  colors.primary,
                  colors.primary,
                ]
              }
              style={styles.actionButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.actionButtonInner}
                onPress={handleLogin}
              >
                <LogIn size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  {t("chooseAction.login") || "Login"}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
            >
              <View style={styles.actionButtonInner}>
                <LogIn size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  {t("chooseAction.login") || "Login"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.buttonDescription,
              {
                color: colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("chooseAction.loginDescription") ||
              "If you already have an account, sign in to continue"}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  actionButton: {
    width: "100%",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden",
  },
  actionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 24,
  },
  buttonDescription: {
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarRowRTL: {
    flexDirection: "row-reverse",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  languageModalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 16,
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  languageOptionText: {
    fontSize: 16,
  },
  languageModalClose: {
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  languageModalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
