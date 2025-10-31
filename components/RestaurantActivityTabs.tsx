import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { useTheme } from "@/hooks/useTheme";
import {
  Coffee,
  UtensilsCrossed,
  Wallet,
  Clock,
  Star,
  Calendar,
  X,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  fetchQRScans,
  fetchPayments,
  loadMoreQRScans,
  loadMorePayments,
} from "@/store/slices/restaurantActivitySlice";
import { QRScan, Payment } from "@/store/types/restaurantActivityTypes";

type TabType = "scans" | "payments";

export const RestaurantActivityTabs: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const {
    scans,
    payments,
    scansLoading,
    paymentsLoading,
    scansError,
    paymentsError,
    scansPagination,
    paymentsPagination,
    scansLoadingMore,
    paymentsLoadingMore,
  } = useSelector((state: RootState) => state.restaurantActivity);

  const [activeTab, setActiveTab] = useState<TabType>("scans");
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedInitially = React.useRef(false);
  const lastLoadedTab = React.useRef<TabType | null>(null);
  const isLoadingMoreRef = React.useRef(false);

  // Date filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDate = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // Load data on first mount only
  useEffect(() => {
    if (!hasLoadedInitially.current) {
      hasLoadedInitially.current = true;
      lastLoadedTab.current = "scans";
      dispatch(fetchQRScans({ page: 1, limit: 20 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (!hasLoadedInitially.current) return; // Skip initial render
    if (lastLoadedTab.current === activeTab) return; // Skip if same tab

    lastLoadedTab.current = activeTab;
    isLoadingMoreRef.current = false; // Reset loading flag

    const params = {
      page: 1,
      limit: 20,
      ...(startDate && { startDate: formatDate(startDate) }),
      ...(endDate && { endDate: formatDate(endDate) }),
    };

    if (activeTab === "scans") {
      dispatch(fetchQRScans(params));
    } else {
      dispatch(fetchPayments(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounce date filter changes
  useEffect(() => {
    if (!startDate && !endDate) return; // Skip if no dates selected

    isLoadingMoreRef.current = false; // Reset loading flag

    const timeoutId = setTimeout(() => {
      const params = {
        page: 1,
        limit: 20,
        ...(startDate && { startDate: formatDate(startDate) }),
        ...(endDate && { endDate: formatDate(endDate) }),
      };

      if (activeTab === "scans") {
        dispatch(fetchQRScans(params));
      } else {
        dispatch(fetchPayments(params));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const loadData = () => {
    const params = {
      page: 1,
      limit: 20,
      ...(startDate && { startDate: formatDate(startDate) }),
      ...(endDate && { endDate: formatDate(endDate) }),
    };

    if (activeTab === "scans") {
      dispatch(fetchQRScans(params));
    } else {
      dispatch(fetchPayments(params));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    const pagination =
      activeTab === "scans" ? scansPagination : paymentsPagination;
    const loadingMore =
      activeTab === "scans" ? scansLoadingMore : paymentsLoadingMore;
    const loading = activeTab === "scans" ? scansLoading : paymentsLoading;

    // Prevent multiple simultaneous calls
    if (isLoadingMoreRef.current) return;
    if (loading || loadingMore) return;
    if (!pagination) return;
    
    // Validate pagination values
    const currentPage = Number(pagination.page);
    const totalPages = Number(pagination.totalPages);
    
    if (isNaN(currentPage) || isNaN(totalPages)) {
      console.warn('Invalid pagination values:', pagination);
      return;
    }
    
    if (currentPage >= totalPages) return;

    isLoadingMoreRef.current = true;

    const params = {
      page: currentPage + 1,
      limit: 20,
      ...(startDate && { startDate: formatDate(startDate) }),
      ...(endDate && { endDate: formatDate(endDate) }),
    };

    const promise =
      activeTab === "scans"
        ? dispatch(loadMoreQRScans(params))
        : dispatch(loadMorePayments(params));

    // Reset the flag after the request completes
    promise.finally(() => {
      isLoadingMoreRef.current = false;
    });
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderScanRecord = ({ item }: { item: QRScan }) => (
    <View style={[styles.record, { backgroundColor: colors.surface }]}>
      <View style={styles.recordHeader}>
        <View style={styles.recordIcon}>
          {item.type === "meal" ? (
            <UtensilsCrossed size={20} color={colors.primary} />
          ) : (
            <Coffee size={20} color={colors.secondary} />
          )}
        </View>
        <View style={styles.recordInfo}>
          <Text style={[styles.recordType, { color: colors.text }]}>
            {item.type === "meal"
              ? t("promotions.food")
              : t("promotions.drinks")}
          </Text>
          <Text style={[styles.userName, { color: colors.textSecondary }]}>
            {item.user?.fullName ||
              item.user?.email ||
              t("restaurant.anonymousUser")}
          </Text>
          <View style={styles.recordDetails}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.recordTime, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.recordPoints}>
          <Text style={[styles.pointsAwarded, { color: colors.success }]}>
            +{item.pointsAwarded}
          </Text>
          <Star size={16} color={colors.success} />
        </View>
      </View>
    </View>
  );

  const renderPaymentRecord = ({ item }: { item: Payment }) => {
    const getPaymentIcon = () => {
      switch (item.paymentType) {
        case "balance":
          return <Wallet size={20} color={colors.success} />;
        case "stars_meal":
          return <UtensilsCrossed size={20} color={colors.primary} />;
        case "stars_drink":
          return <Coffee size={20} color={colors.secondary} />;
      }
    };

    const getPaymentLabel = () => {
      switch (item.paymentType) {
        case "balance":
          return t("purchase.walletBalance");
        case "stars_meal":
          return t("purchase.mealPoints");
        case "stars_drink":
          return t("purchase.drinkPoints");
      }
    };

    return (
      <View style={[styles.record, { backgroundColor: colors.surface }]}>
        <View style={styles.recordHeader}>
          <View style={styles.recordIcon}>{getPaymentIcon()}</View>
          <View style={styles.recordInfo}>
            <Text style={[styles.recordType, { color: colors.text }]}>
              {getPaymentLabel()}
            </Text>
            <Text style={[styles.userName, { color: colors.textSecondary }]}>
              {item.user?.fullName ||
                item.user?.email ||
                t("restaurant.anonymousUser")}
            </Text>
            <View style={styles.recordDetails}>
              <Clock size={14} color={colors.textSecondary} />
              <Text
                style={[styles.recordTime, { color: colors.textSecondary }]}
              >
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.recordPoints}>
            <Text style={[styles.pointsConsumed, { color: colors.error }]}>
              -{item.amount}
            </Text>
            {item.paymentType === "balance" ? (
              <Text style={[styles.currency, { color: colors.error }]}>$</Text>
            ) : (
              <Star size={16} color={colors.error} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = (type: TabType) => {
    const loading = type === "scans" ? scansLoading : paymentsLoading;
    const error = type === "scans" ? scansError : paymentsError;

    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error ||
            (type === "scans"
              ? t("restaurant.noScans")
              : t("restaurant.noPayments"))}
        </Text>
        {error && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>{t("home.retry")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    const loadingMore =
      activeTab === "scans" ? scansLoadingMore : paymentsLoadingMore;
    const pagination = 
      activeTab === "scans" ? scansPagination : paymentsPagination;

    // Don't show loader if there's no more pages to load
    if (pagination && pagination.page >= pagination.totalPages) return null;
    
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderDateFilters = () => (
    <View
      style={[styles.filtersContainer, { backgroundColor: colors.surface }]}
    >
      <View style={styles.dateInputs}>
        {/* Start Date */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Calendar size={14} color={colors.textSecondary} />
          <Text
            style={[
              styles.dateButtonText,
              { color: startDate ? colors.text : colors.textSecondary },
            ]}
          >
            {startDate ? formatDate(startDate) : t("restaurant.fromDate")}
          </Text>
        </TouchableOpacity>

        {/* End Date */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Calendar size={14} color={colors.textSecondary} />
          <Text
            style={[
              styles.dateButtonText,
              { color: endDate ? colors.text : colors.textSecondary },
            ]}
          >
            {endDate ? formatDate(endDate) : t("restaurant.toDate")}
          </Text>
        </TouchableOpacity>

        {/* Clear Button */}
        {(startDate || endDate) && (
          <TouchableOpacity
            style={[
              styles.clearFilterButton,
              { backgroundColor: colors.error + "20" },
            ]}
            onPress={clearFilters}
          >
            <X size={14} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Start Date Picker */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === "ios");
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {/* End Date Picker */}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === "ios");
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "scans" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab("scans")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "scans" ? colors.primary : colors.textSecondary,
                fontWeight: activeTab === "scans" ? "bold" : "normal",
              },
            ]}
          >
            {t("restaurant.qrScans")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "payments" && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setActiveTab("payments")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "payments"
                    ? colors.primary
                    : colors.textSecondary,
                fontWeight: activeTab === "payments" ? "bold" : "normal",
              },
            ]}
          >
            {t("restaurant.payments")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Filters */}
      {renderDateFilters()}

      {/* Content */}
      {activeTab === "scans" ? (
        scansLoading && scans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t("restaurant.loadingScans")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={scans}
            renderItem={renderScanRecord}
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
            ListEmptyComponent={() => renderEmpty("scans")}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
          />
        )
      ) : paymentsLoading && payments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("restaurant.loadingPayments")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentRecord}
          keyExtractor={(item) => item.id}
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
          ListEmptyComponent={() => renderEmpty("payments")}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
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
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  record: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    marginBottom: 4,
  },
  recordDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recordTime: {
    fontSize: 12,
  },
  recordPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pointsAwarded: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pointsConsumed: {
    fontSize: 16,
    fontWeight: "bold",
  },
  currency: {
    fontSize: 14,
    fontWeight: "bold",
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  dateInputs: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 12,
  },
  clearFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
