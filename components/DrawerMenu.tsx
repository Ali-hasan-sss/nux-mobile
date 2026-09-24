import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/AppText";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import {
  Globe,
  FileText,
  Shield,
  Info,
  MessageCircle,
  X,
  Moon,
  Sun,
  Monitor,
  LogOut,
} from "lucide-react-native";
import { RootState } from "@/store/store";
import { setLanguage } from "@/store/slices/languageSlice";
import { logout } from "@/store/slices/authSlice";
import { setTheme } from "@/store/slices/themeSlice";
import { useTheme } from "@/hooks/useTheme";
import { PrivacyPolicyModal } from "@/components/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/TermsOfUseModal";
import { AboutAppModal } from "@/components/AboutAppModal";

const DRAWER_WIDTH = 300;

interface DrawerMenuProps {
  onClose: () => void;
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <Text style={[styles.menuRowText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DrawerMenu({ onClose }: DrawerMenuProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { t, i18n } = useAppTranslation();
  const { colors, mode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useSelector((state: RootState) => state.language);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH - 24)).current;

  const verticalMargin = Math.max(insets.top, 12);

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideX]);

  const handleCloseAnimated = () => {
    Animated.timing(slideX, {
      toValue: -DRAWER_WIDTH - 24,
      duration: 260,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const handleContactUs = () => {
    handleCloseAnimated();
    setTimeout(() => router.push("/contact"), 280);
  };

  const handleLanguageChange = async (language: string) => {
    dispatch(setLanguage(language));
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem("user-language", language);
  };

  const handleThemeChange = (themeMode: "light" | "dark" | "system") => {
    dispatch(setTheme(themeMode));
  };

  const handleLogout = () => {
    dispatch(logout());
    handleCloseAnimated();
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        style={[
          styles.backdrop,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.72)"
              : "rgba(0, 0, 0, 0.45)",
          },
        ]}
        onPress={handleCloseAnimated}
      />
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            width: DRAWER_WIDTH,
            top: verticalMargin,
            bottom: Math.max(insets.bottom, 12),
            transform: [{ translateX: slideX }],
            borderColor: `${colors.primary}30`,
            shadowColor: colors.primary,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: `${colors.primary}12`,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("drawer.title", "Menu")}
          </Text>
          <TouchableOpacity
            onPress={handleCloseAnimated}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.sectionCard, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Globe size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("drawer.language", "Language")}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {[
                { code: "en", label: "English" },
                { code: "ar", label: "العربية" },
                { code: "de", label: "Deutsch" },
              ].map((lang) => {
                const selected = currentLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleLanguageChange(lang.code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? "#fff" : colors.text },
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.sectionCard, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              {mode === "dark" ? (
                <Moon size={18} color={colors.primary} />
              ) : mode === "light" ? (
                <Sun size={18} color={colors.primary} />
              ) : (
                <Monitor size={18} color={colors.primary} />
              )}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("drawer.theme", "Theme")}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {[
                { code: "dark", label: t("drawer.dark", "Dark"), icon: Moon },
                { code: "light", label: t("drawer.light", "Light"), icon: Sun },
                {
                  code: "system",
                  label: t("drawer.system", "System"),
                  icon: Monitor,
                },
              ].map((theme) => {
                const Icon = theme.icon;
                const selected = mode === theme.code;
                return (
                  <TouchableOpacity
                    key={theme.code}
                    style={[
                      styles.chip,
                      styles.chipWithIcon,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() =>
                      handleThemeChange(
                        theme.code as "light" | "dark" | "system"
                      )
                    }
                  >
                    <Icon
                      size={14}
                      color={selected ? "#fff" : colors.text}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? "#fff" : colors.text },
                      ]}
                    >
                      {theme.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.linksGroup}>
            <MenuRow
              icon={FileText}
              label={t("drawer.termsOfUse", "Terms of Use")}
              onPress={() => setTermsModalVisible(true)}
              colors={colors}
            />
            <MenuRow
              icon={Shield}
              label={t("drawer.privacyPolicy", "Privacy Policy")}
              onPress={() => setPrivacyModalVisible(true)}
              colors={colors}
            />
            <MenuRow
              icon={Info}
              label={t("drawer.aboutApp", "About App")}
              onPress={() => setAboutModalVisible(true)}
              colors={colors}
            />
            <MenuRow
              icon={MessageCircle}
              label={t("drawer.contactUs", "Contact Us")}
              onPress={handleContactUs}
              colors={colors}
            />
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LogOut size={18} color="#fff" />
            <Text style={styles.logoutText}>
              {t("account.logout", "Logout")}
            </Text>
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
        <AboutAppModal
          visible={aboutModalVisible}
          onClose={() => setAboutModalVisible(false)}
        />
      </Animated.View>
    </View>
  );
}

const OUTER_RADIUS = 28;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: "absolute",
    left: 0,
    borderTopRightRadius: OUTER_RADIUS,
    borderBottomRightRadius: OUTER_RADIUS,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderLeftWidth: 0,
    overflow: "hidden",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  linksGroup: {
    gap: 8,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
