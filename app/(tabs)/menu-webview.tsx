import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, useWindowDimensions, RefreshControl, Modal, TextInput, FlatList, BackHandler } from "react-native";
import { Text } from "@/components/AppText";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { ArrowLeft, UtensilsCrossed, Clock, Flame, Plus, Minus, X } from "lucide-react-native";
import { getTranslatedAllergen } from "@/data/allergens";
import { menuClientService } from "@/store/services/menuClientService";
import type {
  MenuCategory,
  MenuItem,
  MenuRestaurantInfo,
} from "@/store/services/menuClientService";
import { orderService, type OrderTypeValue } from "@/store/services/orderService";
import { CustomAlert } from "@/components/CustomAlert";
import { API_CONFIG, getImageUrl } from "@/config/api";

export interface CartItemExtra {
  name: string;
  price: number;
  calories: number;
}

export interface CartItem {
  id: number;
  title: string;
  description?: string;
  price: number;
  image?: string;
  quantity: number;
  selectedExtras?: CartItemExtra[];
  preparationTime?: number;
  allergies?: string[];
  kitchenSection?: { id: number; name: string; description?: string };
  notes?: string;
}

function extractQRCode(
  input: string | string[] | undefined
): string | null {
  if (!input) return null;
  const code = Array.isArray(input) ? input[0] : input;
  if (!code) return null;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(code.trim())) return code.trim();
  const urlMatch = code.match(
    /\/menu\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  if (urlMatch?.[1]) return urlMatch[1];
  return code.trim();
}

/** رقم الطاولة يُستخلص من الرابط فقط (عند مسح كود الطاولة). لا يُسمح بالإدخال اليدوي. */
function getTableFromParams(
  table: string | string[] | undefined
): number | null {
  if (table == null) return null;
  const s = Array.isArray(table) ? table[0] : table;
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  return !isNaN(n) && n > 0 ? n : null;
}

export default function MenuNativeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    qrCode: string | string[];
    table?: string | string[];
    fromExplore?: string;
  }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isRTL = i18n.language === "ar";

  const qrCode = extractQRCode(params.qrCode);
  /** رقم الطاولة من الرابط فقط (مسح كود الطاولة). لا إدخال يدوي. */
  const tableNumberFromUrl = getTableFromParams(params.table);
  /** إذا دخل من صفحة استكشاف المطاعم، الرجوع يعيد إلى الاستكشاف؛ وإلا (مسح كود) يعيد للرئيسية */
  const fromExplore = params.fromExplore === "1";

  const [restaurant, setRestaurant] = useState<MenuRestaurantInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [orderType, setOrderType] = useState<OrderTypeValue>("ON_TABLE");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccessVisible, setOrderSuccessVisible] = useState(false);
  const [orderErrorVisible, setOrderErrorVisible] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");

  const [extrasModalVisible, setExtrasModalVisible] = useState(false);
  const [extrasModalItem, setExtrasModalItem] = useState<MenuItem | null>(null);
  const [extrasSelected, setExtrasSelected] = useState<CartItemExtra[]>([]);
  const [extrasQuantity, setExtrasQuantity] = useState(1);
  const [extrasNotes, setExtrasNotes] = useState("");

  const loadCategories = useCallback(async () => {
    if (!qrCode) return;
    setLoadingCategories(true);
    setError(null);
    try {
      const res = await menuClientService.getCategoriesByQRCode(qrCode);
      setCategories(res.data || []);
      setRestaurant(res.restaurant || null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          t("menu.errorLoadingCategories")
      );
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [qrCode, t]);

  const loadItems = useCallback(
    async (categoryId: number) => {
      setLoadingItems(true);
      setError(null);
      try {
        const res = await menuClientService.getItemsByCategory(categoryId);
        setItems(res.data || []);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            t("menu.errorLoadingItems")
        );
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (qrCode) loadCategories();
  }, [qrCode, loadCategories]);

  useEffect(() => {
    if (selectedCategory) loadItems(selectedCategory.id);
    else setItems([]);
  }, [selectedCategory, loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory) await loadItems(selectedCategory.id);
    else await loadCategories();
    setRefreshing(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setItems([]);
    setError(null);
  };

  const handleExitMenu = useCallback(() => {
    if (fromExplore) {
      router.replace("/(tabs)/explore-restaurants");
    } else {
      router.replace("/(tabs)/");
    }
  }, [fromExplore, router]);

  // زر الرجوع بالموبايل: من الأصناف → الفئات، من الفئات → الخروج من القائمة
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (selectedCategory) {
          handleBackToCategories();
          return true;
        }
        handleExitMenu();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [selectedCategory, handleExitMenu])
  );

  if (!qrCode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t("menu.invalidQRCode")}
          </Text>
        </View>
      </View>
    );
  }

  const getCartItemKey = (item: CartItem) =>
    `${item.id}_${JSON.stringify((item.selectedExtras || []).sort((a, b) => a.name.localeCompare(b.name)))}`;

  const cartTotalPrice = cart.reduce((sum, c) => {
    const extrasSum = (c.selectedExtras || []).reduce((s, e) => s + e.price, 0);
    return sum + (c.price + extrasSum) * c.quantity;
  }, 0);

  const addToCart = (item: MenuItem, quantity: number, selectedExtras: CartItemExtra[], notes: string) => {
    const finalPrice =
      item.discountType && item.discountValue != null
        ? item.discountType === "PERCENTAGE"
          ? item.price * (1 - item.discountValue / 100)
          : item.price - item.discountValue
        : item.price;
    const newEntry: CartItem = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: finalPrice,
      image: item.image,
      quantity,
      selectedExtras: selectedExtras.length ? selectedExtras : undefined,
      preparationTime: item.preparationTime,
      allergies: item.allergies,
      kitchenSection: item.kitchenSection,
      notes: notes.trim() || undefined,
    };
    setCart((prev) => {
      const key = getCartItemKey(newEntry);
      const existing = prev.find((c) => getCartItemKey(c) === key);
      if (existing) {
        return prev.map((c) =>
          getCartItemKey(c) === key ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, newEntry];
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const c = next[index];
      const newQty = c.quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== index);
      next[index] = { ...c, quantity: newQty };
      return next;
    });
  };

  const handleAddItem = (item: MenuItem) => {
    const hasExtras = item.extras && Array.isArray(item.extras) && item.extras.length > 0;
    if (hasExtras) {
      setExtrasModalItem(item);
      setExtrasSelected([]);
      setExtrasQuantity(1);
      setExtrasNotes("");
      setExtrasModalVisible(true);
    } else {
      addToCart(item, 1, [], "");
    }
  };

  const handleConfirmExtras = () => {
    if (!extrasModalItem) return;
    addToCart(extrasModalItem, extrasQuantity, extrasSelected, extrasNotes);
    setExtrasModalVisible(false);
    setExtrasModalItem(null);
  };

  const toggleExtra = (name: string, price: number, calories: number) => {
    setExtrasSelected((prev) => {
      const i = prev.findIndex((e) => e.name === name);
      if (i >= 0) return prev.filter((_, idx) => idx !== i);
      return [...prev, { name, price: price || 0, calories: calories || 0 }];
    });
  };

  const placeOrder = async () => {
    if (!qrCode || cart.length === 0 || tableNumberFromUrl == null) return;
    setPlacingOrder(true);
    setOrderErrorMessage("");
    try {
      await orderService.createOrder({
        restaurantId: qrCode,
        tableNumber: tableNumberFromUrl,
        orderType,
        items: cart.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          image: c.image,
          price: c.price,
          quantity: c.quantity,
          selectedExtras: c.selectedExtras,
          notes: c.notes,
          preparationTime: c.preparationTime,
          baseCalories: undefined,
          allergies: c.allergies,
          kitchenSection: c.kitchenSection,
        })),
        totalPrice: Math.round(cartTotalPrice * 100) / 100,
      });
      setCart([]);
      setCartModalVisible(false);
      setOrderSuccessVisible(true);
    } catch (e: any) {
      const data = e?.response?.data;
      const code = data?.code;
      let msg = data?.message || t("menu.orderError");
      if (code === "TABLE_SESSION_NOT_OPEN") msg = t("menu.tableSessionNotOpen");
      else if (code === "NO_ACTIVE_SUBSCRIPTION") msg = t("menu.ordersNotAvailableNoSubscription");
      setOrderErrorMessage(msg);
      setOrderErrorVisible(true);
    } finally {
      setPlacingOrder(false);
    }
  };

  const cardWidth = (width - 20 * 2 - 12) / 2;
  const inputBg = (colors as any).inputBackground ?? colors.surface;

  const CategorySkeletonCard = () => (
    <View
      style={[
        styles.categoryCard,
        { width: cardWidth, backgroundColor: inputBg },
      ]}
    >
      <View
        style={[styles.categoryImage, styles.skeletonBlock, { backgroundColor: colors.border + "50" }]}
      />
      <View style={styles.categoryBody}>
        <View
          style={[styles.skeletonLine, styles.skeletonCategoryTitle, { backgroundColor: colors.border + "50" }]}
        />
        <View
          style={[styles.skeletonLine, styles.skeletonCategoryDesc, { backgroundColor: colors.border + "40" }]}
        />
      </View>
    </View>
  );

  const ItemSkeletonCard = () => (
    <View
      style={[styles.itemCard, { backgroundColor: inputBg }]}
    >
      <View
        style={[styles.itemImagePlaceholder, styles.skeletonBlock, { backgroundColor: colors.border + "50" }]}
      />
      <View style={styles.itemBody}>
        <View
          style={[styles.skeletonLine, styles.skeletonItemTitle, { backgroundColor: colors.border + "50" }]}
        />
        <View
          style={[styles.skeletonLine, styles.skeletonItemDesc, { backgroundColor: colors.border + "40" }]}
        />
        <View style={styles.itemMeta}>
          <View style={[styles.skeletonLine, styles.skeletonMeta, { backgroundColor: colors.border + "40" }]} />
          <View style={[styles.skeletonLine, styles.skeletonMeta, { backgroundColor: colors.border + "40" }]} />
        </View>
        <View style={styles.itemPriceRow}>
          <View style={[styles.skeletonLine, styles.skeletonPrice, { backgroundColor: colors.border + "50" }]} />
          <View style={[styles.skeletonLine, styles.skeletonAddBtn, { backgroundColor: colors.border + "40" }]} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: restaurant + back when in category */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? "rgba(26, 31, 58, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={
            selectedCategory
              ? handleBackToCategories
              : handleExitMenu
          }
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft
            size={24}
            color={colors.text}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {restaurant?.logo ? (
            <Image
              source={{ uri: getImageUrl(restaurant.logo) ?? undefined }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
          <Text
            style={[styles.restaurantName, { color: colors.text }]}
            numberOfLines={1}
          >
            {restaurant?.name || t("menu.title")}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {selectedCategory ? (
          /* Items list */
          <>
            {loadingItems ? (
              <View style={styles.skeletonItemsWrap}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <ItemSkeletonCard key={i} />
                ))}
              </View>
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyBox}>
                <UtensilsCrossed size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t("menu.noItems")}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {t("menu.noItemsDesc")}
                </Text>
              </View>
            ) : (
              items.map((item) => {
                const finalPrice =
                  item.discountType && item.discountValue != null
                    ? item.discountType === "PERCENTAGE"
                      ? item.price * (1 - item.discountValue / 100)
                      : item.price - item.discountValue
                    : item.price;
                const imageUri = getImageUrl(item.image);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: (colors as any).inputBackground ?? colors.surface,
                      },
                    ]}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.itemImagePlaceholder,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.itemImageLetter, { color: colors.primary }]}
                        >
                          {item.title.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.itemBody}>
                      <Text
                        style={[styles.itemTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      {item.description ? (
                        <Text
                          style={[styles.itemDesc, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                      <View style={styles.itemMeta}>
                        {item.preparationTime != null && (
                          <View style={styles.itemMetaItem}>
                            <Clock size={14} color={colors.textSecondary} />
                            <Text style={[styles.itemMetaText, { color: colors.textSecondary }]}>
                              {item.preparationTime} min
                            </Text>
                          </View>
                        )}
                        {item.calories != null && (
                          <View style={styles.itemMetaItem}>
                            <Flame size={14} color={colors.textSecondary} />
                            <Text style={[styles.itemMetaText, { color: colors.textSecondary }]}>
                              {item.calories} cal
                            </Text>
                          </View>
                        )}
                      </View>
                      {item.allergies && item.allergies.length > 0 && (
                        <View style={styles.allergiesRow}>
                          {item.allergies.map((a, idx) => (
                            <View
                              key={idx}
                              style={[styles.allergyChip, { backgroundColor: colors.error + "20" }]}
                            >
                              <Text style={[styles.allergyChipText, { color: colors.error }]}>
                                {getTranslatedAllergen(a, t)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <View style={[styles.itemPriceRow, { marginTop: 8 }]}>
                        <View>
                          <Text style={[styles.itemPrice, { color: colors.primary }]}>
                            {finalPrice.toFixed(2)} €
                          </Text>
                          {item.discountType && item.discountValue != null && (
                            <Text style={[styles.itemOldPrice, { color: colors.textSecondary }]}>
                              {item.price.toFixed(2)} €
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.addButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleAddItem(item)}
                        >
                          <Plus size={18} color="#fff" />
                          <Text style={styles.addButtonText}>{t("menu.addToCart")}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* Categories grid */
          <>
            {loadingCategories ? (
              <View style={styles.categoryGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <CategorySkeletonCard key={i} />
                ))}
              </View>
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyBox}>
                <UtensilsCrossed size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t("menu.noCategories")}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {t("menu.noCategoriesDesc")}
                </Text>
              </View>
            ) : (
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const imageUri = getImageUrl(cat.image);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.85}
                      style={[
                        styles.categoryCard,
                        {
                          width: cardWidth,
                          backgroundColor: (colors as any).inputBackground ?? colors.surface,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.categoryImagePlaceholder,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Text
                            style={[styles.categoryLetter, { color: colors.primary }]}
                          >
                            {cat.title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.categoryBody}>
                        <Text
                          style={[styles.categoryTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {cat.title}
                        </Text>
                        {cat.description ? (
                          <Text
                            style={[styles.categoryDesc, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {cat.description}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating cart button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={[styles.cartFab, { backgroundColor: colors.primary }]}
          onPress={() => setCartModalVisible(true)}
          activeOpacity={0.9}
        >
          <UtensilsCrossed size={22} color="#fff" />
          <Text style={styles.cartFabText}>
            {t("menu.viewOrderItems", { count: cart.reduce((s, c) => s + c.quantity, 0) })}
          </Text>
          <Text style={styles.cartFabTotal}>{cartTotalPrice.toFixed(2)} €</Text>
        </TouchableOpacity>
      )}

      <CustomAlert
        visible={orderSuccessVisible}
        type="success"
        title={t("common.success")}
        message={t("menu.orderPlaced")}
        confirmText={t("common.ok")}
        onConfirm={() => setOrderSuccessVisible(false)}
      />
      <CustomAlert
        visible={orderErrorVisible}
        type="error"
        title={t("common.error")}
        message={orderErrorMessage}
        confirmText={t("common.ok")}
        onConfirm={() => setOrderErrorVisible(false)}
      />

      {/* Cart modal */}
      <Modal visible={cartModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { backgroundColor: colors.background }]}>
            <View style={[styles.cartModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.cartModalTitle, { color: colors.text }]}>{t("menu.cart")}</Text>
              <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cart}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item: c, index }) => {
                const lineTotal = (c.price + (c.selectedExtras || []).reduce((s, e) => s + e.price, 0)) * c.quantity;
                return (
                  <View style={[styles.cartRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.cartRowLeft}>
                      <Text style={[styles.cartRowTitle, { color: colors.text }]} numberOfLines={1}>{c.title}</Text>
                      <Text style={[styles.cartRowPrice, { color: colors.primary }]}>{lineTotal.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.cartRowActions}>
                      <TouchableOpacity
                        onPress={() => updateCartQuantity(index, -1)}
                        style={[styles.cartQtyBtn, { backgroundColor: colors.primary + "30" }]}
                      >
                        <Minus size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={[styles.cartQtyText, { color: colors.text }]}>{c.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateCartQuantity(index, 1)}
                        style={[styles.cartQtyBtn, { backgroundColor: colors.primary + "30" }]}
                      >
                        <Plus size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeFromCart(index)} style={styles.cartRemoveBtn}>
                        <X size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
            <View style={[styles.cartModalFooter, { borderTopColor: colors.border }]}>
              {tableNumberFromUrl != null ? (
                <Text style={[styles.cartTableLabel, { color: colors.textSecondary }]}>
                  {t("menu.tableNumber")}: <Text style={{ color: colors.text, fontWeight: "600" }}>{tableNumberFromUrl}</Text>
                </Text>
              ) : (
                <Text style={[styles.cartTableHint, { color: colors.textSecondary }]}>
                  {t("menu.orderOnlyWithTableScan")}
                </Text>
              )}
              <View style={styles.orderTypeRow}>
                <TouchableOpacity
                  style={[styles.orderTypeBtn, orderType === "ON_TABLE" && { backgroundColor: colors.primary }]}
                  onPress={() => setOrderType("ON_TABLE")}
                >
                  <Text style={[styles.orderTypeBtnText, { color: orderType === "ON_TABLE" ? "#fff" : colors.text }]}>
                    {t("menu.orderTypeOnTable")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderTypeBtn, orderType === "TAKE_AWAY" && { backgroundColor: colors.primary }]}
                  onPress={() => setOrderType("TAKE_AWAY")}
                >
                  <Text style={[styles.orderTypeBtnText, { color: orderType === "TAKE_AWAY" ? "#fff" : colors.text }]}>
                    {t("menu.orderTypeTakeAway")}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cartTotalRow}>
                <Text style={[styles.cartTotalLabel, { color: colors.text }]}>{t("menu.placeOrder")}</Text>
                <Text style={[styles.cartTotalValue, { color: colors.primary }]}>{cartTotalPrice.toFixed(2)} €</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.placeOrderBtn,
                  {
                    backgroundColor: tableNumberFromUrl != null ? colors.primary : colors.textSecondary,
                    opacity: tableNumberFromUrl != null ? 1 : 0.7,
                  },
                ]}
                onPress={placeOrder}
                disabled={placingOrder || tableNumberFromUrl == null}
              >
                {placingOrder ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.placeOrderBtnText}>
                    {tableNumberFromUrl != null ? t("menu.placeOrder") : t("menu.placeOrderDisabledNoTable")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Extras modal */}
      <Modal visible={extrasModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.extrasModal, { backgroundColor: colors.background }]}>
            <View style={[styles.cartModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.cartModalTitle, { color: colors.text }]}>
                {extrasModalItem ? extrasModalItem.title : ""}
              </Text>
              <TouchableOpacity onPress={() => { setExtrasModalVisible(false); setExtrasModalItem(null); }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.extrasModalScroll}>
              {extrasModalItem?.extras?.map((extra: any, idx: number) => {
                const isSelected = extrasSelected.some((e) => e.name === extra.name);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.extrasItem,
                      { backgroundColor: isSelected ? colors.primary + "20" : colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => toggleExtra(extra.name, extra.price || 0, extra.calories || 0)}
                  >
                    <Text style={[styles.extrasItemName, { color: colors.text }]}>{extra.name}</Text>
                    <Text style={[styles.extrasItemPrice, { color: colors.primary }]}>
                      +{(extra.price || 0).toFixed(2)} €
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={[styles.extrasSectionLabel, { color: colors.textSecondary }]}>{t("menu.quantity")}</Text>
              <View style={styles.extrasQtyRow}>
                <TouchableOpacity
                  style={[styles.cartQtyBtn, { backgroundColor: colors.primary + "30" }]}
                  onPress={() => setExtrasQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.cartQtyText, { color: colors.text }]}>{extrasQuantity}</Text>
                <TouchableOpacity
                  style={[styles.cartQtyBtn, { backgroundColor: colors.primary + "30" }]}
                  onPress={() => setExtrasQuantity((q) => q + 1)}
                >
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.extrasSectionLabel, { color: colors.textSecondary }]}>{t("menu.notes")} ({t("menu.optional")})</Text>
              <TextInput
                style={[styles.extrasNotesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t("menu.notesPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                value={extrasNotes}
                onChangeText={setExtrasNotes}
                multiline
              />
            </ScrollView>
            <View style={[styles.extrasModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirmExtras}
              >
                <Text style={styles.placeOrderBtnText}>{t("menu.addToCart")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 56,
    height: 32,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 124,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 16,
  },
  skeletonBlock: {
    borderRadius: 4,
  },
  skeletonLine: {
    borderRadius: 4,
  },
  skeletonCategoryTitle: {
    height: 16,
    width: "80%",
  },
  skeletonCategoryDesc: {
    height: 12,
    width: "50%",
    marginTop: 8,
  },
  skeletonItemsWrap: {
    paddingBottom: 20,
  },
  skeletonItemTitle: {
    height: 16,
    width: "75%",
  },
  skeletonItemDesc: {
    height: 12,
    width: "90%",
    marginTop: 8,
  },
  skeletonMeta: {
    height: 12,
    width: 56,
  },
  skeletonPrice: {
    height: 18,
    width: 64,
  },
  skeletonAddBtn: {
    height: 36,
    width: 100,
    borderRadius: 8,
  },
  errorBox: {
    padding: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 180,
  },
  categoryImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
  },
  categoryImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLetter: {
    fontSize: 32,
    fontWeight: "700",
  },
  categoryBody: {
    padding: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  itemCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
    backgroundColor: "#eee",
  },
  itemImagePlaceholder: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  itemImageLetter: {
    fontSize: 28,
    fontWeight: "700",
  },
  itemBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  itemMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemMetaText: {
    fontSize: 12,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  itemOldPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  allergiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  allergyChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  allergyChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cartFab: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cartFabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cartFabTotal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  cartModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  cartModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  cartModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  cartRowLeft: {
    flex: 1,
  },
  cartRowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cartRowPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  cartRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartQtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cartQtyText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },
  cartRemoveBtn: {
    padding: 4,
  },
  cartModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  cartTableLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  cartTableHint: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
  },
  cartTableInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  orderTypeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  orderTypeBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cartTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  cartTotalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  placeOrderBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  extrasModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  extrasModalScroll: {
    padding: 16,
    maxHeight: 360,
  },
  extrasItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  extrasItemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  extrasItemPrice: {
    fontSize: 15,
    fontWeight: "600",
  },
  extrasSectionLabel: {
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
  },
  extrasQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  extrasNotesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: "top",
    marginTop: 8,
  },
  extrasModalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
