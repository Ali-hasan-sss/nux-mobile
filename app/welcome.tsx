import React, { useState } from "react";
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
import { useDispatch } from "react-redux";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { setLanguage } from "@/store/slices/languageSlice";
import { ChevronDown } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

export default function WelcomeScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLanguageSelect = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowLanguagePicker(false);

    // Save language
    await AsyncStorage.setItem("user-language", langCode);
    dispatch(setLanguage(langCode));
    await i18n.changeLanguage(langCode);
  };

  const handleContinue = async () => {
    // Save selected language
    await AsyncStorage.setItem("user-language", selectedLanguage);
    dispatch(setLanguage(selectedLanguage));
    await i18n.changeLanguage(selectedLanguage);

    // Navigate to choose action screen with animation
    router.push("/choose-action");
  };

  const selectedLang = languages.find((lang) => lang.code === selectedLanguage);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
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

        <Text style={[styles.welcomeText, { color: colors.text }]}>
          {t("welcome.title") || "Welcome"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("welcome.subtitle") || "Choose your preferred language"}
        </Text>

        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t("welcome.selectLanguage") || "Select Language"}
          </Text>
          <TouchableOpacity
            style={[
              styles.languageButton,
              { backgroundColor: (colors as any).inputBackground ?? colors.surface },
            ]}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <Text style={[styles.languageText, { color: colors.text }]}>
              {selectedLang?.flag} {selectedLang?.name}
            </Text>
            <ChevronDown
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: showLanguagePicker ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {/* Language Options */}
          {showLanguagePicker && (
            <View
              style={[
                styles.languageOptions,
                { backgroundColor: (colors as any).inputBackground ?? colors.surface },
              ]}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.code && {
                      backgroundColor: colors.primary + "20",
                    },
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text
                    style={[styles.languageOptionText, { color: colors.text }]}
                  >
                    {lang.flag} {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          {(colors as any).gradientButton ? (
            <LinearGradient
              colors={
                (colors as any).gradientButton || [
                  colors.primary,
                  colors.primary,
                ]
              }
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>
                {t("welcome.continue") || "Continue"}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.continueButtonGradient,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.continueButtonText}>
                {t("welcome.continue") || "Continue"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
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
  welcomeText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  languageContainer: {
    width: "100%",
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  languageOptions: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
  },
  languageOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  languageOptionText: {
    fontSize: 16,
  },
  continueButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
