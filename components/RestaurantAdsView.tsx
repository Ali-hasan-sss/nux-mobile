import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { MapPin, Trash2 } from "lucide-react-native";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { RestaurantMapModal } from "@/components/RestaurantMapModal";
import { useFocusEffect } from "expo-router";
import {
  fetchRestaurantAds,
  deleteRestaurantAd,
} from "@/store/slices/adsSlice";
import { Ad } from "@/store/types/adsTypes";
import { getImageUrl } from "@/config/api";

export const RestaurantAdsView: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { ads, loading, error } = useSelector((state: RootState) => state.ads);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Ad | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load restaurant ads only on focus (not on mount to avoid double fetch)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchRestaurantAds());
    }, [dispatch])
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchRestaurantAds());
    } catch (error) {
      console.error("Error refreshing ads:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAd = (ad: Ad) => {
    Alert.alert(
      t("common.confirm"),
      `${t("restaurant.confirmDeleteAd")} "${ad.title}"?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteRestaurantAd(ad.id));
          },
        },
      ]
    );
  };

  const handleRestaurantLocation = (ad: Ad) => {
    setSelectedRestaurant(ad);
    setMapModalVisible(true);
  };

  const renderAd = ({ item }: { item: Ad }) => {
    const imageUri =
      getImageUrl(item.image) ||
      getImageUrl(item.restaurant.logo) ||
      "https://via.placeholder.com/400x160?text=No+Image";

    return (
      <TouchableOpacity
        style={[styles.adCard, { backgroundColor: colors.surface }]}
        onPress={() => handleRestaurantLocation(item)}
      >
        <Image source={{ uri: imageUri }} style={styles.adImage} />
        <View style={styles.adContent}>
          <View style={styles.adHeader}>
            <Text style={[styles.adTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <TouchableOpacity onPress={() => handleRestaurantLocation(item)}>
              <MapPin size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.adDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>

          <View style={styles.adFooter}>
            <Text style={[styles.adDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={() => handleDeleteAd(item)}
            >
              <Trash2 size={16} color="white" />
              <Text style={styles.deleteButtonText}>{t("common.delete")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    // Don't show empty state while loading or refreshing
    if (loading || refreshing) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error || t("restaurant.noAds")}
        </Text>
        {error && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => dispatch(fetchRestaurantAds())}
          >
            <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Only show full loading screen on initial load (not during refresh)
  if (loading && !refreshing && (!ads || ads.length === 0)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t("restaurant.loadingAds")}
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={ads || []}
        renderItem={renderAd}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {selectedRestaurant && (
        <RestaurantMapModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          restaurant={{
            name: selectedRestaurant.restaurant.name,
            latitude: selectedRestaurant.restaurant.latitude,
            longitude: selectedRestaurant.restaurant.longitude,
            address: selectedRestaurant.restaurant.address,
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  adCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  adImage: {
    width: "100%",
    height: 160,
  },
  adContent: {
    padding: 16,
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  adDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  adFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
