import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Modal, Platform, Alert, Linking } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { X, MapPin } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

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

export function RestaurantMapModal({
  visible,
  onClose,
  restaurant,
}: RestaurantMapModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (visible) {
      checkLocationPermission();
      setMapReady(false);
      setMapError(null);
    } else {
      setMapReady(false);
      setMapError(null);
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
    } catch {
      setHasLocationPermission(false);
    }
  };

  const handleOpenInMaps = async () => {
    try {
      const { latitude, longitude, name } = restaurant;
      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
          name
        )})`,
      });

      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (err: any) {
      console.error("Failed to open maps:", err);
      Alert.alert(
        t("common.error") || "Error",
        t("promotions.failedToOpenMaps") || "Failed to open maps application"
      );
    }
  };

  const showFallback = !!mapError || (Platform.OS !== "ios" && Platform.OS !== "android");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: 16,
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

        {showFallback ? (
          <View style={styles.fallbackContent}>
            <MapPin size={64} color={colors.primary} style={{ marginBottom: 24 }} />
            <View style={styles.restaurantInfoPreview}>
              <Text style={[styles.restaurantNamePreview, { color: colors.text }]}>
                {restaurant.name}
              </Text>
              {restaurant.address ? (
                <Text
                  style={[styles.restaurantAddressPreview, { color: colors.textSecondary }]}
                >
                  {restaurant.address}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t("promotions.useMapsAppInstead")}
            </Text>
            <TouchableOpacity
              style={[styles.openMapsButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenInMaps}
            >
              <Text style={styles.openMapsButtonText}>
                {t("promotions.openInMaps")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={hasLocationPermission && mapReady}
            showsMyLocationButton={hasLocationPermission && mapReady}
            toolbarEnabled={false}
            onMapReady={() => {
              setMapError(null);
              setMapReady(true);
            }}
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
        )}

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 20) + 8,
              paddingTop: 20,
            },
          ]}
        >
          <View style={styles.restaurantHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.restaurantName, { color: colors.text }]}>
              {restaurant.name}
            </Text>
          </View>
          {restaurant.address ? (
            <Text
              style={[styles.restaurantAddress, { color: colors.textSecondary }]}
            >
              {restaurant.address}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.openMapsButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenInMaps}
          >
            <Text style={styles.openMapsButtonText}>
              {t("promotions.openInMaps")}
            </Text>
          </TouchableOpacity>
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
  fallbackContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  restaurantInfoPreview: {
    alignItems: "center",
    marginBottom: 16,
  },
  restaurantNamePreview: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  restaurantAddressPreview: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 16,
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  openMapsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  openMapsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
    minHeight: 120,
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
