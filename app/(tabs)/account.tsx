import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import {
  User,
  Phone,
  Mail,
  Lock,
  Save,
  Crown,
  Trash2,
  Edit,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store/store";
import { updatePhoneNumber } from "@/store/slices/userSlice";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { EditRestaurantModal } from "@/components/EditRestaurantModal";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";

export default function AccountScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const user = useSelector((state: RootState) => state.user);

  // Profile management
  const {
    profile,
    isLoading,
    error,
    updateLoading,
    passwordChangeLoading,
    deleteLoading,
    fetchProfile,
    updateUserProfile,
    changeUserPassword,
    deleteUserAccount,
    clearProfileError,
  } = useProfile();

  const isRestaurant = auth.user?.role === "RESTAURANT_OWNER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(user.phoneNumber);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [editRestaurantModalVisible, setEditRestaurantModalVisible] =
    useState(false);
  const [upgradePlanModalVisible, setUpgradePlanModalVisible] = useState(false);

  // Load profile on component mount
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchProfile();
    }
  }, [auth.isAuthenticated, fetchProfile]);

  // Update form fields when profile is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.fullName || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // QR Code is now fetched from profile API

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearProfileError();
    };
  }, [clearProfileError]);

  const handleSaveProfile = async () => {
    try {
      if (!name.trim() || !email.trim()) {
        Alert.alert(t("common.error"), "Please fill in all required fields");
        return;
      }

      const result = await updateUserProfile({
        fullName: name.trim(),
        email: email.trim(),
      });

      if (result.type.endsWith("/fulfilled")) {
        Alert.alert(t("common.success"), t("account.profileUpdated"));
        dispatch(updatePhoneNumber(phone));
      } else {
        Alert.alert(
          t("common.error"),
          (result.payload as string) || "Failed to update profile"
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to update profile"
      );
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        Alert.alert(t("common.error"), "Please fill in all password fields");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert(t("common.error"), "New passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert(
          t("common.error"),
          "Password must be at least 6 characters"
        );
        return;
      }

      const result = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      if (result.type.endsWith("/fulfilled")) {
        Alert.alert(t("common.success"), "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        Alert.alert(
          t("common.error"),
          (result.payload as string) || "Failed to update password"
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to update password"
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!deletePassword) {
        Alert.alert(
          t("common.error"),
          "Please enter your password to delete account"
        );
        return;
      }

      Alert.alert(
        "Delete Account",
        "Are you sure you want to delete your account? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const result = await deleteUserAccount({
                password: deletePassword,
              });

              if (result.type.endsWith("/fulfilled")) {
                Alert.alert(
                  "Account Deleted",
                  "Your account has been deleted successfully",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Navigate to login or clear auth state
                        // This would typically be handled by the auth system
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  (result.payload as string) || "Failed to delete account"
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || "Failed to delete account"
      );
    }
  };

  const handleUpgradePlan = () => {
    setUpgradePlanModalVisible(true);
  };
  return (
    <LinearGradient
      colors={isDark ? colors.gradient : ["#FFFFFF", "#F8FAFC"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
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

            <LinearGradient
              colors={
                isDark
                  ? (colors as any).gradientButton || [
                      colors.primary,
                      colors.primary,
                    ]
                  : [colors.primary, colors.primary]
              }
              style={[styles.saveButton, { opacity: updateLoading ? 0.7 : 1 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.saveButtonInner}
                onPress={handleSaveProfile}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Save size={20} color="white" />
                )}
                <Text style={styles.saveButtonText}>
                  {updateLoading ? "Saving..." : t("account.save")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
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

            <LinearGradient
              colors={
                isDark
                  ? ["#FF6B9D", "#C471ED"]
                  : [colors.secondary, colors.secondary]
              }
              style={[
                styles.saveButton,
                { opacity: passwordChangeLoading ? 0.7 : 1 },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity
                style={styles.saveButtonInner}
                onPress={handleUpdatePassword}
                disabled={passwordChangeLoading}
              >
                {passwordChangeLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Lock size={20} color="white" />
                )}
                <Text style={styles.saveButtonText}>
                  {passwordChangeLoading
                    ? "Updating..."
                    : t("account.updatePassword")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {isRestaurant ? (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("restaurant.planManagement")}
              </Text>
              <LinearGradient
                colors={
                  isDark
                    ? (colors as any).gradientButton || [
                        colors.primary,
                        colors.primary,
                      ]
                    : [colors.primary, colors.primary]
                }
                style={styles.upgradeButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity
                  style={styles.upgradeButtonInner}
                  onPress={() => setEditRestaurantModalVisible(true)}
                >
                  <Edit size={20} color="white" />
                  <Text style={styles.upgradeButtonText}>
                    {t("restaurant.editInfo")}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
              <LinearGradient
                colors={
                  isDark
                    ? ["#FF6B9D", "#C471ED"]
                    : [colors.secondary, colors.secondary]
                }
                style={[styles.upgradeButton, { marginTop: 12 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity
                  style={styles.upgradeButtonInner}
                  onPress={handleUpgradePlan}
                >
                  <Crown size={20} color="white" />
                  <Text style={styles.upgradeButtonText}>
                    {t("restaurant.upgradePlan")}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
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
                {profile?.qrCode && profile.qrCode.trim() !== "" ? (
                  <QRCode
                    value={profile.qrCode}
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
                      {isLoading ? "Loading..." : "No QR Code Available"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Delete Account Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Danger Zone
            </Text>
            <Text
              style={[
                styles.dangerDescription,
                { color: colors.textSecondary },
              ]}
            >
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>

            <View style={styles.inputGroup}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password to confirm deletion"
                placeholderTextColor={colors.textSecondary}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  backgroundColor: colors.error,
                  opacity: deleteLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Trash2 size={20} color="white" />
              )}
              <Text style={styles.deleteButtonText}>
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Restaurant Modal */}
        {isRestaurant && (
          <>
            <EditRestaurantModal
              visible={editRestaurantModalVisible}
              onClose={() => setEditRestaurantModalVisible(false)}
            />
            <UpgradePlanModal
              visible={upgradePlanModalVisible}
              onClose={() => setUpgradePlanModalVisible(false)}
            />
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonText: {
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
    borderRadius: 16,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
