import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { Text } from "@/components/AppText";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Search, Filter, MapPin, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import { RestaurantMapModal } from "@/components/RestaurantMapModal";
import { RestaurantAdsView } from "@/components/RestaurantAdsView";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchAds,
  refreshAds,
  setFilters,
  clearFilters,
} from "@/store/slices/adsSlice";
import { Ad } from "@/store/types/adsTypes";
import { getImageUrl } from "@/config/api";

const TAB_BAR_HEIGHT = 88;
const SKELETON_CARD_COUNT = 5;

function AdCardSkeleton({
  colors,
  isDark,
}: {
  colors: any;
  isDark: boolean;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bg = isDark ? colors.surface : colors.background;
  const placeholderBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <Animated.View
      style={[
        styles.promotionCard,
        { backgroundColor: bg, opacity: pulse },
      ]}
    >
      <View style={[styles.promotionImage, { backgroundColor: placeholderBg }]} />
      <View style={styles.promotionContent}>
        <View style={styles.restaurantHeader}>
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: placeholderBg, width: 120 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { backgroundColor: placeholderBg, width: 24, height: 24, borderRadius: 12 },
            ]}
          />
        </View>
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: placeholderBg, width: "80%", marginBottom: 8 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: placeholderBg, width: "100%", height: 12, marginBottom: 4 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: placeholderBg, width: "70%", height: 12, marginBottom: 4 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: placeholderBg, width: 60, height: 10, marginTop: 4 },
          ]}
        />
      </View>
    </Animated.View>
  );
}

export default function PromotionsScreen() {
  const { t } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const listBottomPadding = insets.bottom + TAB_BAR_HEIGHT;

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
  // Filter options match ad categories from restaurant dashboard (website): Desserts, Fast Food, Drinks, Other
  const filterOptions = [
    { key: "all", label: t("promotions.all") },
    { key: "Desserts", label: t("promotions.desserts") },
    { key: "Fast Food", label: t("promotions.fastFood") },
    { key: "Drinks", label: t("promotions.drinks") },
    { key: "Other", label: t("promotions.other") },
  ];

  // Load ads from Redux
  const loadAds = useCallback(
    (page: number = 1, append: boolean = false) => {
      const categoryFilter =
        selectedFilters.length > 0 &&
        selectedFilters[0] !== "all"
          ? selectedFilters[0]
          : undefined;

      const adsFilters = {
        page,
        pageSize: 10,
        search: searchQuery.trim() || undefined,
        category: categoryFilter,
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
    const categoryFilter =
      selectedFilters.length > 0 && selectedFilters[0] !== "all"
        ? selectedFilters[0]
        : undefined;

    const adsFilters = {
      page: 1,
      pageSize: 10,
      search: searchQuery.trim() || undefined,
      category: categoryFilter,
    };

    dispatch(refreshAds(adsFilters));
  };

  // Handle load more (pagination: load next page when user scrolls near end)
  const handleLoadMore = useCallback(() => {
    if (
      !loading &&
      pagination &&
      pagination.currentPage < pagination.totalPages &&
      ads.length > 0
    ) {
      loadAds(pagination.currentPage + 1, true);
    }
  }, [loading, pagination, ads.length, loadAds]);

  const toggleFilter = (filterKey: string) => {
    if (filterKey === "all") {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) =>
      prev.includes(filterKey) ? [] : [filterKey]
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
        style={[
          styles.promotionCard,
          {
            backgroundColor: isDark ? colors.surface : colors.background,
          },
        ]}
        onPress={() => handleRestaurantLocation(item)}
      >
        <Image source={{ uri: imageUri }} style={styles.promotionImage} />
        <View style={styles.promotionContent}>
          <View style={styles.restaurantHeader}>
            <Text style={[styles.restaurantName, { color: colors.primary }, font]}>
              {item.restaurant.name}
            </Text>
            <TouchableOpacity onPress={() => handleRestaurantLocation(item)}>
              <MapPin size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.promotionTitle, { color: colors.text }, font]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.promotionDescription,
              { color: colors.textSecondary },
              font,
            ]}
          >
            {item.description}
          </Text>
          <Text style={[styles.validUntil, { color: colors.textSecondary }, font]}>
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
        <Text style={[styles.emptyText, { color: colors.textSecondary }, font]}>
          {error || t("promotions.noPromotions")}
        </Text>
        {error && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => loadAds(1, false)}
          >
            <Text style={[styles.retryButtonText, font]}>{t("home.retry")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }, font]}>
            {t("promotions.title")}
          </Text>

          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.background,
              },
            ]}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor: isDark
                    ? "transparent"
                    : colors.background,
                },
              ]}
              placeholder={t("promotions.search")}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
<View style={styles.filtersRow}>
                {filterOptions.map((filterOpt) => {
                  const isSelected =
                    filterOpt.key === "all"
                      ? selectedFilters.length === 0
                      : selectedFilters.includes(filterOpt.key);
                  return (
                    <TouchableOpacity
                      key={filterOpt.key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                              ? colors.surface
                              : colors.background,
                        },
                      ]}
                      onPress={() => toggleFilter(filterOpt.key)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: isSelected
                              ? "white"
                              : colors.text,
                          },
                          font,
                        ]}
                      >
                        {filterOpt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selectedFilters.length > 0 && selectedFilters[0] !== "all" && (
                  <TouchableOpacity
                    style={[
                      styles.clearButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={() => setSelectedFilters([])}
                  >
                    <Text style={[styles.clearButtonText, font]}>
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
          <FlatList
            data={Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => i)}
            keyExtractor={(i) => String(i)}
            renderItem={() => (
              <AdCardSkeleton colors={colors} isDark={isDark} />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: listBottomPadding },
            ]}
            style={{ backgroundColor: "transparent" }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={ads}
            renderItem={renderAd}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: listBottomPadding },
            ]}
            style={{ backgroundColor: "transparent" }}
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
            onEndReachedThreshold={0.4}
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
    backgroundColor: "transparent",
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
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "transparent",
  },
  promotionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  promotionImage: {
    width: "100%",
    height: 160,
  },
  promotionContent: {
    padding: 16,
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
  skeletonLine: {
    height: 14,
    borderRadius: 6,
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
