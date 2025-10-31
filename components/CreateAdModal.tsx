import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { X, Upload, Camera } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import * as ImagePicker from "expo-image-picker";
import api from "@/api/axiosInstance";
import { fetchRestaurantAds } from "@/store/slices/adsSlice";

interface CreateAdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAdModal({ visible, onClose }: CreateAdModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [adType, setAdType] = useState<"food" | "drink">("food");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImageUri(uri);

        // Upload image immediately
        await uploadImage(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.error"), "Failed to pick image");
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();

      // Extract filename and type from uri
      const filename = uri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("file", {
        uri,
        name: filename,
        type,
      } as any);

      formData.append("entityType", "ad");

      const response = await api.post("/uploadFile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setUploadedImageUrl(response.data.data.url);
        console.log("✅ Image uploaded:", response.data.data.url);
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.message || "Failed to upload image"
      );
      setImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAd = async () => {
    if (!title || !details) {
      Alert.alert(t("common.error"), t("restaurant.fillAllFields"));
      return;
    }

    if (!uploadedImageUrl) {
      Alert.alert(t("common.error"), t("restaurant.uploadImageFirst"));
      return;
    }

    setCreating(true);
    try {
      const adData = {
        title: title.trim(),
        description: details.trim(),
        image: uploadedImageUrl,
        category: adType,
      };

      const response = await api.post("/restaurants/ads", adData);

      if (response.data.success) {
        Alert.alert(t("common.success"), t("restaurant.adCreated"));

        // Refresh ads list
        dispatch(fetchRestaurantAds());

        // Reset form and close
        resetForm();
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to create ad");
      }
    } catch (error: any) {
      console.error("Error creating ad:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.message || t("restaurant.adCreationFailed")
      );
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDetails("");
    setAdType("food");
    setImageUri(null);
    setUploadedImageUrl(null);
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
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("restaurant.createAd")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("restaurant.adImage")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.imageUpload,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleImagePicker}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text
                      style={[
                        styles.uploadingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("restaurant.uploadingImage")}
                    </Text>
                  </View>
                ) : imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.uploadedImage}
                  />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Upload size={32} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.uploadText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("restaurant.uploadImage")}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("restaurant.adTitle")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("restaurant.adTitlePlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("restaurant.adDetails")}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t("restaurant.adDetailsPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t("restaurant.adType")}
              </Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        adType === "food" ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAdType("food")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: adType === "food" ? "white" : colors.text },
                    ]}
                  >
                    {t("promotions.food")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        adType === "drink" ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAdType("drink")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: adType === "drink" ? "white" : colors.text },
                    ]}
                  >
                    {t("promotions.drinks")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.primary,
                  opacity: creating ? 0.6 : 1,
                },
              ]}
              onPress={handleCreateAd}
              disabled={creating || uploading}
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>
                  {t("restaurant.createAd")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "100%",
    overflow: "hidden",
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
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  imageUpload: {
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  uploadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  uploadingText: {
    fontSize: 14,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
