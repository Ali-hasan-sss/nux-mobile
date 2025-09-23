import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { User, Phone, Mail, Lock, Save, Crown } from "lucide-react-native";
import { RootState } from "@/store/store";
import { updateProfile } from "@/store/slices/authSlice";
import { updatePhoneNumber, generateQRCode } from "@/store/slices/userSlice";
import { useTheme } from "@/hooks/useTheme";

export default function AccountScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const user = useSelector((state: RootState) => state.user);

  const isRestaurant = auth.user?.accountType === "restaurant";

  const [name, setName] = useState(auth.user?.name || "");
  const [email, setEmail] = useState(auth.user?.email || "");
  const [phone, setPhone] = useState(user.phoneNumber);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  React.useEffect(() => {
    if (!isRestaurant) {
      // Generate QR code when component mounts (only for users)
      const qrData = JSON.stringify({
        userId: auth.user?.id,
        email: auth.user?.email,
      });
      dispatch(generateQRCode(qrData));
    }
  }, [auth.user, dispatch]);

  const handleSaveProfile = () => {
    if (auth.user) {
      dispatch(updateProfile({ name, email }));
      dispatch(updatePhoneNumber(phone));
      Alert.alert(t("common.success"), "Profile updated successfully");
    }
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert(t("common.error"), "Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert(t("common.error"), "New passwords do not match");
      return;
    }

    // Handle password update
    Alert.alert(t("common.success"), "Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleUpgradePlan = () => {
    Alert.alert(
      t("restaurant.upgradePlan"),
      "Upgrade plan feature coming soon!"
    );
  };
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("account.title")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("account.profile")}
          </Text>

          <View style={styles.inputGroup}>
            <User size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.name")}
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Mail size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.email")}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Phone size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.phone")}
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveProfile}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>{t("account.save")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("account.updatePassword")}
          </Text>

          <View style={styles.inputGroup}>
            <Lock size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.currentPassword")}
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.newPassword")}
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t("account.confirmNewPassword")}
              placeholderTextColor={colors.textSecondary}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.secondary }]}
            onPress={handleUpdatePassword}
          >
            <Lock size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {t("account.updatePassword")}
            </Text>
          </TouchableOpacity>
        </View>

        {isRestaurant ? (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("restaurant.planManagement")}
            </Text>
            <TouchableOpacity
              style={[
                styles.upgradeButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={handleUpgradePlan}
            >
              <Crown size={20} color="white" />
              <Text style={styles.upgradeButtonText}>
                {t("restaurant.upgradePlan")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("account.myQRCode")}
            </Text>
            <Text
              style={[styles.qrDescription, { color: colors.textSecondary }]}
            >
              {t("account.qrCodeDesc")}
            </Text>

            <View style={styles.qrContainer}>
              {user.qrCode ? (
                <QRCode
                  value={user.qrCode}
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
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    paddingVertical: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
