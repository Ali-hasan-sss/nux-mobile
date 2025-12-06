import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { useTranslation } from "react-i18next";
import {
  Settings,
  Globe,
  FileText,
  Shield,
  Info,
  X,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { setLanguage } from "@/store/slices/languageSlice";
import { logout } from "@/store/slices/authSlice";
import { useTheme } from "@/hooks/useTheme";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";

interface DrawerMenuProps {
  onClose: () => void;
}

export function DrawerMenu({ onClose }: DrawerMenuProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const slideX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [slideX]);

  const handleCloseAnimated = () => {
    Animated.timing(slideX, {
      toValue: -300,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const handleLanguageChange = async (language: string) => {
    dispatch(setLanguage(language));
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem("user-language", language);
    // Direction is forced to LTR globally; no RTL toggling here
  };

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleCloseAnimated} />
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            transform: [{ translateX: slideX }],
            left: 0,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Menu</Text>
          <TouchableOpacity onPress={handleCloseAnimated}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {t("drawer.accountSettings")}
            </Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.menuItem}>
              <Globe size={20} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t("drawer.language")}
              </Text>
            </View>
            <View style={styles.optionsContainer}>
              {[
                { code: "en", label: "English" },
                { code: "ar", label: "العربية" },
                { code: "de", label: "Deutsch" },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        currentLanguage === lang.code
                          ? colors.primary
                          : colors.surface,
                    },
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          currentLanguage === lang.code ? "white" : colors.text,
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setTermsModalVisible(true)}
          >
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {t("drawer.termsOfUse")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <Shield size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {t("drawer.privacyPolicy")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Info size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {t("drawer.aboutApp")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>{t("account.logout")}</Text>
          </TouchableOpacity>
        </ScrollView>

        <PrivacyPolicyModal
          visible={privacyModalVisible}
          onClose={() => setPrivacyModalVisible(false)}
        />

        <TermsOfUseModal
          visible={termsModalVisible}
          onClose={() => setTermsModalVisible(false)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "relative",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    marginLeft: 32,
    marginTop: 8,
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
