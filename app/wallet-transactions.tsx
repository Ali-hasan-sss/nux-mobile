import React, { useCallback, useEffect, useState } from "react";
import { walletLedgerTitleKey } from "@/lib/walletLedgerTitle";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Text } from "@/components/AppText";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  type WalletLedgerEntry,
} from "@/api/walletPaymentApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAlert } from "@/contexts/AlertContext";

const PAGE = 30;

function formatWhen(iso: string, language: string): string {
  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function WalletTransactionsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useAlert();

  const [items, setItems] = useState<WalletLedgerEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currency, setCurrency] = useState<string>("EUR");

  useEffect(() => {
    let alive = true;
    fetchWalletBalance()
      .then((b) => {
        if (alive && b?.currency) setCurrency(b.currency);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const applyBatch = useCallback((batch: WalletLedgerEntry[], append: boolean) => {
    if (append) {
      setItems((prev) => [...prev, ...batch]);
    } else {
      setItems(batch);
    }
    setHasMore(batch.length >= PAGE);
    if (batch.length > 0) {
      setCursor(batch[batch.length - 1]!.id);
    } else if (!append) {
      setCursor(undefined);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const batch = await fetchWalletTransactions(PAGE, undefined);
        if (!alive) return;
        applyBatch(batch, false);
      } catch (e: unknown) {
        if (!alive) return;
        showToast({
          message: getApiErrorMessage(e, t("wallet.transactionsError")),
          type: "error",
        });
        setItems([]);
        setHasMore(false);
        setCursor(undefined);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [applyBatch, showToast, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const batch = await fetchWalletTransactions(PAGE, undefined);
      applyBatch(batch, false);
    } catch (e: unknown) {
      showToast({
        message: getApiErrorMessage(e, t("wallet.transactionsError")),
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  }, [applyBatch, showToast, t]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore || loading || items.length === 0 || !cursor) return;
    setLoadingMore(true);
    try {
      const batch = await fetchWalletTransactions(PAGE, cursor);
      applyBatch(batch, true);
    } catch (e: unknown) {
      showToast({
        message: getApiErrorMessage(e, t("wallet.transactionsError")),
        type: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [applyBatch, cursor, hasMore, items.length, loading, loadingMore, showToast, t]);

  const cardBg = isDark ? colors.surface : colors.background;
  const border = colors.border;

  const renderItem = ({ item }: { item: WalletLedgerEntry }) => {
    const credit = item.type === "CREDIT";
    const titleKey = walletLedgerTitleKey(item.type, item.source, "user");
    const title = titleKey
      ? t(titleKey)
      : credit
        ? t("wallet.credit")
        : t("wallet.debit");
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: cardBg,
            borderColor: border,
          },
        ]}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: (credit ? colors.success : colors.error) + "22" },
          ]}
        >
          {credit ? (
            <ArrowDownLeft size={22} color={colors.success} />
          ) : (
            <ArrowUpRight size={22} color={colors.error} />
          )}
        </View>
        <View style={styles.rowBody}>
          <Text style={[{ color: colors.text, fontSize: 15 }, font]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }, font]}>
            {formatWhen(item.createdAt, i18n.language)}
          </Text>
          {!titleKey ? (
            <Text style={[{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }, font]}>
              {t("wallet.source")}: {item.source}
            </Text>
          ) : null}
        </View>
        <Text style={[{ color: credit ? colors.success : colors.error, fontSize: 15 }, font]}>
          {credit ? "+" : "−"}
          {item.amount} {currency}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }, font]}>
          {t("wallet.transactions")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <Text style={[{ color: colors.textSecondary, textAlign: "center", marginTop: 48 }, font]}>
              {t("wallet.noTransactions")}
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18 },
  listContent: { padding: 16, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
