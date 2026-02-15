import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { X, Building2, MapPin, Navigation, Upload } from "lucide-react-native";
import {
  fetchRestaurantInfo,
  updateRestaurantInfo,
} from "@/store/slices/restaurantInfoSlice";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import api from "@/api/axiosInstance";
import { CrossPlatformStorage } from "@/store/services/crossPlatformStorage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getImageUrl } from "@/config/api";

interface EditRestaurantModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditRestaurantModal: React.FC<EditRestaurantModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  const { info, loading, updating } = useSelector(
    (state: RootState) => state.restaurantInfo
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch restaurant info when modal opens
  useEffect(() => {
    if (visible) {
      dispatch(fetchRestaurantInfo());
    }
  }, [visible, dispatch]);

  // Update form when info is loaded
  useEffect(() => {
    if (info) {
      setName(info.name);
      setAddress(info.address);
      setLatitude(info.latitude?.toString() || "");
      setLongitude(info.longitude?.toString() || "");
      setLogo(info.logo);
    }
  }, [info]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("common.error"),
          "Permission to access media library is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const originalUri = result.assets[0].uri;

        // Compress and resize image before uploading
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          originalUri,
          [
            { resize: { width: 1024 } }, // Max width 1024px for logo
          ],
          {
            compress: 0.7, // Compress to 70% quality
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        await uploadImage(manipulatedImage.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.error"), "Failed to pick image");
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      // Get auth token
      const tokens = await CrossPlatformStorage.getTokens();
      const token = tokens?.accessToken;

      // Extract filename and type from uri
      const filename = uri.split("/").pop() || "restaurant-logo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      console.log("📤 Uploading logo:", filename, "Type:", type);

      // Create FormData - React Native way (using uri directly)
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      } as any);
      formData.append("entityType", "logo");

      console.log("📦 FormData created");

      // Upload using fetch API
      const response = await fetch("https://back.nuxapp.de/api/uploadFile", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Don't set Content-Type - let React Native set it automatically with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Upload response:", data);

      if (data.success) {
        setLogo(data.data.url);
        Alert.alert(t("common.success"), t("restaurant.logoUploaded"));
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("❌ Error uploading logo:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("restaurant.uploadFailed")
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert(t("common.error"), t("restaurant.fillAllFields"));
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(t("common.error"), "Please enter valid coordinates");
      return;
    }

    try {
      const result = await dispatch(
        updateRestaurantInfo({
          name: name.trim(),
          address: address.trim(),
          latitude: lat,
          longitude: lng,
          ...(logo && { logo }),
        })
      );

      if (updateRestaurantInfo.fulfilled.match(result)) {
        Alert.alert(t("common.success"), t("restaurant.infoUpdated"));
        onClose();
      } else {
        Alert.alert(
          t("common.error"),
          (result.payload as string) || "Failed to update restaurant"
        );
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || "Failed to update");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border || "#E5E7EB" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("restaurant.editInfo")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                {t("common.loading")}...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              {/* Logo */}
              <View style={styles.logoSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("restaurant.logo")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.logoContainer,
                    { borderColor: colors.border || "#E5E7EB" },
                  ]}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                  ) : logo ? (
                    <Image
                      source={{ uri: getImageUrl(logo) ?? logo }}
                      style={styles.logoImage}
                    />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Upload size={32} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.logoPlaceholderText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {t("restaurant.uploadLogo")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("restaurant.name")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Building2 size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("restaurant.namePlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("restaurant.address")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <MapPin size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t("restaurant.addressPlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
              </View>

              {/* Latitude */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("restaurant.latitude")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Navigation size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="0.0000"
                    placeholderTextColor={colors.textSecondary}
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Longitude */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("restaurant.longitude")}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Navigation size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="0.0000"
                    placeholderTextColor={colors.textSecondary}
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: updating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>{t("common.save")}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  logoSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  logoPlaceholderText: {
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
