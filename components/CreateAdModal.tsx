import React, { useState } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Upload, Camera } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import * as ImagePicker from 'expo-image-picker';

interface CreateAdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAdModal({ visible, onClose }: CreateAdModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [adType, setAdType] = useState<'meals' | 'drinks'>('meals');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateAd = () => {
    if (!title || !details) {
      Alert.alert(t('common.error'), 'Please fill in all fields');
      return;
    }

    // Handle ad creation logic here
    Alert.alert(t('common.success'), 'Ad created successfully!');

    // Reset form
    setTitle('');
    setDetails('');
    setAdType('meals');
    setImageUri(null);
    onClose();
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
              {t('restaurant.createAd')}
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
                {t('restaurant.adImage')}
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
              >
                {imageUri ? (
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
                      {t('restaurant.uploadImage')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('restaurant.adTitle')}
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
                placeholder={t('restaurant.adTitlePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('restaurant.adDetails')}
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
                placeholder={t('restaurant.adDetailsPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('restaurant.adType')}
              </Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        adType === 'meals' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAdType('meals')}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: adType === 'meals' ? 'white' : colors.text },
                    ]}
                  >
                    {t('promotions.food')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        adType === 'drinks' ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setAdType('drinks')}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: adType === 'drinks' ? 'white' : colors.text },
                    ]}
                  >
                    {t('promotions.drinks')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateAd}
            >
              <Text style={styles.createButtonText}>
                {t('restaurant.createAd')}
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
    textAlignVertical: 'top',
  },
  imageUpload: {
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
