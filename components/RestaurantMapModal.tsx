import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { X, MapPin } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Linking } from "react-native";

// Safely import react-native-maps with fallback
// Import will be handled dynamically in the component to avoid Node.js build issues
let MapView: any = null;
let Marker: any = null;

// Maps will be loaded dynamically in component to avoid Node.js build issues

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
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load maps library when modal opens (only in React Native runtime)
  useEffect(() => {
    if (visible && !mapsLoaded) {
      // Only try to load in native platforms
      if (Platform.OS === "ios" || Platform.OS === "android") {
        // Check if already loaded
        if (MapView && Marker) {
          console.log("✅ react-native-maps already loaded");
          setMapsLoaded(true);
          return;
        }

        try {
          console.log("🔄 Loading react-native-maps...");
          // Use dynamic require - metro.config.js will handle web/Node.js cases
          const Maps = require("react-native-maps");

          // Try different export patterns
          MapView = Maps.default || Maps.MapView || Maps;
          Marker = Maps.Marker;

          console.log("📦 Maps module:", {
            hasDefault: !!Maps.default,
            hasMapView: !!Maps.MapView,
            hasMarker: !!Maps.Marker,
            MapViewType: typeof MapView,
            MarkerType: typeof Marker,
          });

          if (MapView && Marker) {
            console.log("✅ react-native-maps loaded successfully");
            setMapsLoaded(true);
            setMapError(null);
          } else {
            console.warn(
              "⚠️ react-native-maps loaded but MapView/Marker not found"
            );
            setMapError(t("promotions.mapLoadError"));
          }
        } catch (error: any) {
          console.error("❌ react-native-maps not available:", {
            message: error?.message,
            error: error,
            stack: error?.stack,
          });
          setMapError(t("promotions.mapLoadError"));
        }
      } else {
        // Web platform - maps not available
        console.log("🌐 Web platform - maps not available");
        setMapError(t("promotions.mapLoadError"));
      }
    }
  }, [visible, mapsLoaded, t]);

  // Request location permission when modal opens
  useEffect(() => {
    if (visible) {
      checkLocationPermission();
      setMapReady(false);
      setMapError(null);
    } else {
      // Reset state when modal closes
      setMapReady(false);
      setMapError(null);
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
      // Reset error when permission is checked
      setMapError(null);
    } catch (error) {
      console.warn("Location permission check failed:", error);
      setHasLocationPermission(false);
      // Don't set error here, just disable user location
    }
  };

  const handleOpenInMaps = () => {
    const { latitude, longitude, name, address } = restaurant;
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
        name
      )})`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open maps:", err);
        Alert.alert(t("common.error"), t("promotions.failedToOpenMaps"));
      });
    }
  };

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

        {mapError || !mapsLoaded || !MapView || !Marker ? (
          <View style={styles.errorContainer}>
            <MapPin
              size={64}
              color={colors.primary}
              style={{ marginBottom: 24 }}
            />
            <View style={styles.restaurantInfoPreview}>
              <Text style={[styles.restaurantName, { color: colors.text }]}>
                {restaurant.name}
              </Text>
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
            <Text
              style={[styles.errorSubtext, { color: colors.textSecondary }]}
            >
              {t("promotions.useMapsAppInstead")}
            </Text>
            <TouchableOpacity
              style={[
                styles.openMapsButton,
                { backgroundColor: colors.primary },
              ]}
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
            // Only show user location if permission is granted
            showsUserLocation={hasLocationPermission && mapReady}
            showsMyLocationButton={hasLocationPermission && mapReady}
            toolbarEnabled={false}
            onError={(error: any) => {
              console.error("MapView error:", error);
              setMapError(t("promotions.mapLoadError"));
            }}
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
            styles.restaurantInfo,
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
  restaurantInfo: {
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
    // Ensure content is above safe area bottom
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  restaurantInfoPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
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
});
