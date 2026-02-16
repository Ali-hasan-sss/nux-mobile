import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from "react-native";
import { Text } from "@/components/AppText";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
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
  Share2,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RootState } from "@/store/store";
import { updatePhoneNumber } from "@/store/slices/userSlice";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { useAlert } from "@/contexts/AlertContext";
export default function AccountScreen() {
  const { t } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const titleStyle = { color: colors.text, fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const sectionTitleStyle = { color: colors.text, fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const { showToast, showAlert } = useAlert();
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

  const sectionBg = isDark ? colors.surface : colors.background;
  const iconBg = (hex: string) => (isDark ? hex + "20" : hex + "15");
  const qrViewShotRef = useRef<any>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(user.phoneNumber);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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
        showToast({
          message: t("account.fillRequiredFields", "Please fill in all required fields"),
          type: "error",
        });
        return;
      }

      const result = await updateUserProfile({
        fullName: name.trim(),
        email: email.trim(),
      });

      if (result.type.endsWith("/fulfilled")) {
        showToast({ message: t("account.profileUpdated"), type: "success" });
        dispatch(updatePhoneNumber(phone));
      } else {
        showToast({
          message: (result.payload as string) || t("account.profileUpdateFailed", "Failed to update profile"),
          type: "error",
        });
      }
    } catch (error: any) {
      showToast({
        message: error.message || t("account.profileUpdateFailed", "Failed to update profile"),
        type: "error",
      });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast({
          message: t("account.fillPasswordFields", "Please fill in all password fields"),
          type: "error",
        });
        return;
      }

      if (newPassword !== confirmNewPassword) {
        showToast({
          message: t("account.passwordsDoNotMatch", "New passwords do not match"),
          type: "error",
        });
        return;
      }

      if (newPassword.length < 8) {
        showToast({
          message: t("auth.passwordMinLength"),
          type: "error",
        });
        return;
      }

      if (!/[A-Z]/.test(newPassword)) {
        showToast({
          message: t("auth.passwordRequiresUppercase"),
          type: "error",
        });
        return;
      }

      if (!/\d/.test(newPassword)) {
        showToast({
          message: t("auth.passwordRequiresNumber"),
          type: "error",
        });
        return;
      }

      const result = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      if (result.type.endsWith("/fulfilled")) {
        showToast({
          message: t("account.passwordUpdated", "Password updated successfully"),
          type: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        showToast({
          message: (result.payload as string) || t("account.passwordUpdateFailed", "Failed to update password"),
          type: "error",
        });
      }
    } catch (error: any) {
      showToast({
        message: error.message || t("account.passwordUpdateFailed", "Failed to update password"),
        type: "error",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!deletePassword) {
        showToast({
          message: t("account.enterPasswordToDelete", "Please enter your password to delete account"),
          type: "error",
        });
        return;
      }

      showAlert({
        title: t("account.deleteAccount", "Delete Account"),
        message: t("account.deleteAccountConfirm", "Are you sure you want to delete your account? This action cannot be undone."),
        type: "warning",
        confirmText: t("common.delete", "Delete"),
        cancelText: t("common.cancel", "Cancel"),
        onConfirm: async () => {
          const result = await deleteUserAccount({
            password: deletePassword,
          });

          if (result.type.endsWith("/fulfilled")) {
            showToast({
              message: t("account.accountDeleted", "Your account has been deleted successfully"),
              type: "success",
            });
          } else {
            showToast({
              message: (result.payload as string) || t("account.deleteAccountFailed", "Failed to delete account"),
              type: "error",
            });
          }
        },
      });
    } catch (error: any) {
      showToast({
        message: error.message || t("account.deleteAccountFailed", "Failed to delete account"),
        type: "error",
      });
    }
  };

  const handleShareMyCode = async () => {
    if (!profile?.qrCode || !qrViewShotRef.current) return;
    try {
      const uri = await qrViewShotRef.current.capture?.({
        format: "png",
        result: "tmpfile",
      });
      if (!uri) throw new Error("Capture failed");
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showToast({
          message: t("account.sharingNotAvailable"),
          type: "error",
        });
        return;
      }
      const fileUri = Platform.OS === "ios" ? `file://${uri}` : uri;
      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: t("account.myQRCode"),
      });
    } catch (err) {
      showToast({
        message: t("account.shareFailed"),
        type: "error",
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, titleStyle]}>
            {t("account.title")}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: sectionBg }]}>
            <Text style={[styles.sectionTitle, sectionTitleStyle]}>
              {t("account.profile")}
            </Text>

            <View style={styles.inputGroup}>
              <User size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.name")}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.email")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                editable={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Phone size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
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
                <Text style={[styles.saveButtonText, font]}>
                  {updateLoading ? t("account.saving") : t("account.save")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={[styles.section, { backgroundColor: sectionBg }]}>
            <Text style={[styles.sectionTitle, sectionTitleStyle]}>
              {t("account.updatePassword")}
            </Text>

            <View style={styles.inputGroup}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.currentPassword")}
                placeholderTextColor={colors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword((s) => !s)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.newPassword")}
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword((s) => !s)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.confirmNewPassword")}
                placeholderTextColor={colors.textSecondary}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((s) => !s)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
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
                <Text style={[styles.saveButtonText, font]}>
                  {passwordChangeLoading
                    ? t("account.updating")
                    : t("account.updatePassword")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={[styles.section, { backgroundColor: sectionBg }]}>
              <Text style={[styles.sectionTitle, sectionTitleStyle]}>
                {t("account.myQRCode")}
              </Text>
              <Text
                style={[styles.qrDescription, { color: colors.textSecondary }, font]}
              >
                {t("account.qrCodeDesc")}
              </Text>

              <View style={styles.qrContainer}>
                {profile?.qrCode && profile.qrCode.trim() !== "" ? (
                  <>
                    <ViewShot
                      ref={qrViewShotRef}
                      options={{ format: "png", result: "tmpfile" }}
                      style={styles.qrShotWrapper}
                    >
                      <View style={styles.qrShareCard}>
                        <QRCode
                          value={profile.qrCode}
                          size={200}
                          color="#000000"
                          backgroundColor="#FFFFFF"
                        />
                        <View style={styles.qrUserInfo}>
                          {profile.fullName && (
                            <Text style={[styles.qrShareName, font]}>
                              {profile.fullName}
                            </Text>
                          )}
                          <Text style={[styles.qrShareEmail, font]}>
                            {auth.user?.email || profile.email}
                          </Text>
                        </View>
                      </View>
                    </ViewShot>
                    <TouchableOpacity
                      onPress={handleShareMyCode}
                      style={[
                        styles.shareButtonBelow,
                        { backgroundColor: iconBg(colors.primary) },
                      ]}
                    >
                      <Share2 size={22} color={colors.primary} />
                      <Text
                        style={[
                          styles.shareButtonText,
                          { color: colors.primary },
                          font,
                        ]}
                      >
                        {t("account.shareCode")}
                      </Text>
                    </TouchableOpacity>
                  </>
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
                        font,
                      ]}
                    >
                      {isLoading ? t("account.loadingQR") : t("account.noQRCodeAvailable")}
                    </Text>
                  </View>
                )}
              </View>
            </View>

          {/* Delete Account Section */}
          <View style={[styles.section, { backgroundColor: sectionBg }]}>
            <Text style={[styles.sectionTitle, sectionTitleStyle]}>
              {t("account.dangerZone")}
            </Text>
            <Text
              style={[
                styles.dangerDescription,
                { color: colors.textSecondary },
                font,
              ]}
            >
              {t("account.dangerZoneDescription")}
            </Text>

            <View style={styles.inputGroup}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }, font]}
                placeholder={t("account.enterPasswordConfirmDelete", "Enter your password to confirm deletion")}
                placeholderTextColor={colors.textSecondary}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={!showDeletePassword}
              />
              <TouchableOpacity
                onPress={() => setShowDeletePassword((s) => !s)}
                style={styles.eyeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {showDeletePassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
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
              <Text style={[styles.deleteButtonText, font]}>
                {deleteLoading ? t("account.deletingAccount") : t("account.deleteAccount")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for tabs
    backgroundColor: "transparent",
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
  eyeButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: "center",
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
  qrShotWrapper: {
    alignItems: "center",
  },
  qrShareCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  qrUserInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  qrShareName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#000000",
  },
  qrShareEmail: {
    fontSize: 14,
    color: "#000000",
  },
  shareButtonBelow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
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
