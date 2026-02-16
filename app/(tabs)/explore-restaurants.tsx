import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput, FlatList, Image, I18nManager, ScrollView } from "react-native";
import { Text } from "@/components/AppText";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, Search, MapPin } from "lucide-react-native";
import { getRestaurants, getNearbyRestaurants } from "@/api/restaurantsApi";
import type { RestaurantListItem } from "@/api/restaurantsApi";
import { getImageUrl } from "@/config/api";
import * as Location from "expo-location";

type SortOption = "name" | "distance" | "newest";

export default function ExploreRestaurantsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily };
  const router = useRouter();
  const isRTL = i18n.language === "ar" || I18nManager.isRTL;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [list, setList] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "pending"
  >("pending");
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Debounce search: update debouncedSearch 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const PAGE_SIZE = 50;

  const loadRestaurants = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!append) {
        setLoading(true);
      }
      setError(null);
      try {
        if (sortBy === "distance") {
          let coords = userCoords;
          if (!coords) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === "granted" ? "granted" : "denied");
            if (status !== "granted") {
              setError(t("exploreRestaurants.locationRequired"));
              setList([]);
              setLoading(false);
              return;
            }
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserCoords(coords);
          }
          const nearby = await getNearbyRestaurants({
            latitude: coords.latitude,
            longitude: coords.longitude,
            radius: 50,
            limit: 50,
          });
          setList(nearby);
          setPage(1);
          setTotalPages(1);
        } else {
          const res = await getRestaurants({
            page: pageNum,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
          });
          let items = res.restaurants || [];
          if (sortBy === "name") {
            items = [...items].sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", undefined, {
                sensitivity: "base",
              })
            );
          }
          const pagination = res.pagination;
          setTotalPages(pagination?.totalPages ?? 1);
          setPage(pageNum);
          if (append) {
            setList((prev) => [...prev, ...items]);
          } else {
            setList(items);
          }
        }
      } catch (e: any) {
        setError(e?.message || t("exploreRestaurants.errorLoading"));
        if (!append) setList([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sortBy, debouncedSearch, userCoords, t]
  );

  const loadMoreRestaurants = useCallback(() => {
    if (sortBy === "distance") return;
    if (loadingMore || loading) return;
    if (page >= totalPages) return;
    setLoadingMore(true);
    loadRestaurants(page + 1, true);
  }, [sortBy, loadingMore, loading, page, totalPages, loadRestaurants]);

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [loadRestaurants])
  );

  useEffect(() => {
    if (sortBy !== "distance") {
      const timer = setTimeout(loadRestaurants, 100);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearch, sortBy]);

  const handleBack = () => router.back();

  // When sorting by distance, filter current list by search query without refetch
  const displayList =
    sortBy === "distance" && searchQuery.trim()
      ? list.filter((r) =>
          (r.name || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : list;

  const openMenu = (restaurant: RestaurantListItem) => {
    router.push({
      pathname: "/(tabs)/menu-webview",
      params: { qrCode: restaurant.id, fromExplore: "1" },
    });
  };

  const renderItem = ({ item }: { item: RestaurantListItem }) => {
    const logoUri = getImageUrl(item.logo);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => openMenu(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: colors.border + "40" },
              ]}
            >
              <MapPin size={24} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.address ? (
              <Text
                style={[styles.cardAddress, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.address}
              </Text>
            ) : null}
            {typeof item.distance === "number" && (
              <Text style={[styles.distance, { color: colors.primary }]}>
                {item.distance < 1
                  ? `${Math.round(item.distance * 1000)} m`
                  : `${item.distance.toFixed(1)} km`}
              </Text>
            )}
          </View>
          <Text style={[styles.viewMenu, { color: colors.primary }]}>
            {t("exploreRestaurants.viewMenu")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const SkeletonCard = () => (
    <View
      style={[styles.card, styles.skeletonCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.cardRow}>
        <View
          style={[
            styles.logoPlaceholder,
            styles.skeletonBlock,
            { backgroundColor: colors.border + "50" },
          ]}
        />
        <View style={styles.cardBody}>
          <View
            style={[
              styles.skeletonLine,
              styles.skeletonTitle,
              { backgroundColor: colors.border + "50" },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              styles.skeletonAddress,
              { backgroundColor: colors.border + "40" },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              styles.skeletonAddressShort,
              { backgroundColor: colors.border + "40" },
            ]}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: back button + title (no bottom border) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }, font]}>
          {t("exploreRestaurants.title")}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("exploreRestaurants.searchPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.chipsRow}>
        {(["name", "distance", "newest"] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              {
                backgroundColor:
                  sortBy === key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSortBy(key)}
          >
            <Text
              style={[
                styles.chipText,
                { color: sortBy === key ? "#fff" : colors.text },
                font,
              ]}
            >
              {t(`exploreRestaurants.sortBy${key.charAt(0).toUpperCase() + key.slice(1)}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ScrollView
          style={[styles.listContent, { flex: 1 }]}
          contentContainerStyle={styles.skeletonListContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={loadRestaurants}
          >
            <Text style={styles.retryBtnText}>{t("home.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : displayList.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("exploreRestaurants.noRestaurants")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreRestaurants}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={[styles.footerLoader, { paddingVertical: 16 }]}>
                <Text style={[styles.footerLoaderText, { color: colors.textSecondary }]}>
                  {t("common.loading")}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  skeletonListContent: {
    paddingBottom: 120,
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoaderText: {
    fontSize: 14,
  },
  skeletonCard: {
    opacity: 0.9,
  },
  skeletonBlock: {},
  skeletonLine: {
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 16,
    width: "70%",
    marginBottom: 8,
  },
  skeletonAddress: {
    height: 12,
    width: "90%",
    marginBottom: 4,
  },
  skeletonAddressShort: {
    height: 12,
    width: "50%",
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    marginTop: 4,
  },
  viewMenu: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
