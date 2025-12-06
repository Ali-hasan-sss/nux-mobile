import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router, Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { UserPlus, LogIn } from "lucide-react-native";
import { RootState } from "@/store/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ChooseActionScreen() {
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isRTL = i18n.language === "ar";
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

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
});
