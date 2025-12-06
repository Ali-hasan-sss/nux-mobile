import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { X, MapPin } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RestaurantMapModalProps {
  visible: boolean;
  onClose: () => void;
  restaurant: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const { width, height } = Dimensions.get("window");

export function RestaurantMapModal({
  visible,
  onClose,
  restaurant,
}: RestaurantMapModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, 16) + 16,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("promotions.restaurantLocation")}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            }}
            title={restaurant.name}
            description={restaurant.address}
            pinColor={colors.primary}
          />
        </MapView>

        <View
          style={[
            styles.restaurantInfo,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.restaurantHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.restaurantName, { color: colors.text }]}>
              {restaurant.name}
            </Text>
          </View>
          {restaurant.address && (
            <Text
              style={[
                styles.restaurantAddress,
                { color: colors.textSecondary },
              ]}
            >
              {restaurant.address}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  map: {
    flex: 1,
  },
  restaurantInfo: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
  },
  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  restaurantAddress: {
    fontSize: 14,
    marginLeft: 28,
  },
});
