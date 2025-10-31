import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Camera } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";

interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  targetId: string;
  giftType: string;
  giftAmount: string;
}

export default function ScanModal({
  visible,
  onClose,
  targetId,
  giftType,
  giftAmount,
}: ScanModalProps) {
  const { colors } = useTheme();

  const handleOpenCamera = () => {
    onClose();
    router.push({
      pathname: "/camera/gift-scan",
      params: {
        targetId: targetId,
        giftType: giftType,
        giftAmount: giftAmount,
        onQRScanned: "true",
      },
    });
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
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Scan Recipient's QR Code
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Position the QR code within the frame to scan
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleOpenCamera}
            >
              <Camera size={20} color="white" />
              <Text style={styles.buttonText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
