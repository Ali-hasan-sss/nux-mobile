import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Search, Filter, MapPin, Plus } from "lucide-react-native";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { RestaurantMapModal } from "@/components/RestaurantMapModal";
import { CreateAdModal } from "@/components/CreateAdModal";
import { RestaurantAdsView } from "@/components/RestaurantAdsView";
import { useFocusEffect } from "expo-router";
import {
  fetchAds,
  refreshAds,
  setFilters,
  clearFilters,
} from "@/store/slices/adsSlice";
import { Ad } from "@/store/types/adsTypes";

export default function PromotionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const auth = useSelector((state: RootState) => state.auth);
  const { ads, pagination, loading, refreshing, error, filters } = useSelector(
    (state: RootState) => state.ads
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(
    filters.category ? [filters.category] : []
  );
  const [showFilters, setShowFilters] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Ad | null>(null);
  const [createAdModalVisible, setCreateAdModalVisible] = useState(false);

  const isRestaurant = auth.user?.role === "RESTAURANT_OWNER";
  const filterOptions = [
    { key: "food", label: t("promotions.food") },
    { key: "drink", label: t("promotions.drinks") },
  ];

  // Load ads from Redux
  const loadAds = useCallback(
    (page: number = 1, append: boolean = false) => {
      const categoryFilter = selectedFilters.find(
        (f) => f === "food" || f === "drink"
      );

      const adsFilters = {
        page,
        pageSize: 10,
        search: searchQuery.trim() || undefined,
        category: categoryFilter || undefined,
      };

      dispatch(fetchAds({ filters: adsFilters, append }));
    },
    [searchQuery, selectedFilters, dispatch]
  );

  // Initial fetch and when filters/search change
  useEffect(() => {
    loadAds(1, false);
  }, [searchQuery, selectedFilters]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      loadAds(1, false);
    }, [])
  );

  // Handle refresh
  const handleRefresh = () => {
    const categoryFilter = selectedFilters.find(
      (f) => f === "food" || f === "drink"
    );

    const adsFilters = {
      page: 1,
      pageSize: 10,
      search: searchQuery.trim() || undefined,
      category: categoryFilter || undefined,
    };

    dispatch(refreshAds(adsFilters));
  };

  // Handle load more
  const handleLoadMore = () => {
    if (
      !loading &&
      pagination &&
      pagination.currentPage < pagination.totalPages
    ) {
      loadAds(pagination.currentPage + 1, true);
    }
  };

  const toggleFilter = (filterKey: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterKey)
        ? prev.filter((f) => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const handleRestaurantLocation = (ad: Ad) => {
    setSelectedRestaurant(ad);
    setMapModalVisible(true);
  };

  const renderAd = ({ item }: { item: Ad }) => {
    // Use image or logo as fallback
    const imageUri =
      item.image ||
      item.restaurant.logo ||
      "https://via.placeholder.com/400x160?text=No+Image";

    return (
      <TouchableOpacity
        style={[styles.promotionCard, { backgroundColor: colors.surface }]}
        onPress={() => handleRestaurantLocation(item)}
      >
        <Image source={{ uri: imageUri }} style={styles.promotionImage} />
        <View style={styles.promotionContent}>
          <View
            style={[
              styles.discountBadge,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text style={styles.discountText}>
              {item.category === "food" ? "🍽️" : "☕"}
            </Text>
          </View>
          <View style={styles.restaurantHeader}>
            <Text style={[styles.restaurantName, { color: colors.primary }]}>
              {item.restaurant.name}
            </Text>
            <TouchableOpacity onPress={() => handleRestaurantLocation(item)}>
              <MapPin size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.promotionTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.promotionDescription,
              { color: colors.textSecondary },
            ]}
          >
            {item.description}
          </Text>
          <Text style={[styles.validUntil, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error || t("promotions.noPromotions")}
        </Text>
        {error && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => loadAds(1, false)}
          >
            <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // For restaurant owners - show their own ads
  if (isRestaurant) {
    return (
      <>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("restaurant.myAds")}
            </Text>
          </View>

          <RestaurantAdsView />
        </View>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setCreateAdModalVisible(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>

        <CreateAdModal
          visible={createAdModalVisible}
          onClose={() => setCreateAdModalVisible(false)}
        />
      </>
    );
  }

  // For regular users - show all ads
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("promotions.title")}
          </Text>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t("promotions.search")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filtersRow}>
                  {filterOptions.map((filterOpt) => (
                    <TouchableOpacity
                      key={filterOpt.key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selectedFilters.includes(
                            filterOpt.key
                          )
                            ? colors.primary
                            : colors.surface,
                        },
                      ]}
                      onPress={() => toggleFilter(filterOpt.key)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: selectedFilters.includes(filterOpt.key)
                              ? "white"
                              : colors.text,
                          },
                        ]}
                      >
                        {filterOpt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {selectedFilters.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.clearButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={() => setSelectedFilters([])}
                    >
                      <Text style={styles.clearButtonText}>
                        {t("common.clear")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {loading && ads.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t("common.loading")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={ads}
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
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </View>

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  promotionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  promotionImage: {
    width: "100%",
    height: 160,
  },
  promotionContent: {
    padding: 16,
  },
  discountBadge: {
    position: "absolute",
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "600",
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  validUntil: {
    fontSize: 12,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
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
