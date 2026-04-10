import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { Text } from "@/components/AppText";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, X, Store } from "lucide-react-native";
import { RootState } from "@/store/store";
import {
  setSelectedRestaurant,
  type Restaurant as ReduxRestaurant,
} from "@/store/slices/restaurantSlice";
import { useTheme } from "@/hooks/useTheme";
import { getImageUrl } from "@/config/api";

/**
 * Rows from balance API may omit `userBalance` (it lives on the balance item).
 * Redux `selectedRestaurant` matches {@link ReduxRestaurant} and is a valid row here too.
 */
export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  logo?: string;
  userBalance?: {
    walletBalance: number;
    drinkPoints: number;
    mealPoints: number;
  };
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface RestaurantSelectorProps {
  restaurants?: Restaurant[];
  onRestaurantChange?: (restaurant: Restaurant) => void;
}

export function RestaurantSelector({
  restaurants = [],
  onRestaurantChange,
}: RestaurantSelectorProps) {
  const { t } = useTranslation();
  const { colors, defaultFontFamily } = useTheme();
  const font = { fontFamily: defaultFontFamily, fontWeight: "400" as const };
  const dispatch = useDispatch();
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    const restaurantForSlice: ReduxRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address ?? "",
      logo: restaurant.logo,
      userBalance:
        restaurant.userBalance ?? {
          walletBalance: 0,
          drinkPoints: 0,
          mealPoints: 0,
        },
    };
    dispatch(setSelectedRestaurant(restaurantForSlice));
    onRestaurantChange?.(restaurant);
    setModalVisible(false);
  };

  const renderRestaurantLogo = (restaurant: Restaurant, size: "row" | "list") => {
    const logoUri = getImageUrl(restaurant.logo);
    const logoStyle = size === "row" ? styles.selectorLogo : styles.restaurantLogo;
    const phStyle =
      size === "row"
        ? styles.selectorLogoPlaceholder
        : styles.restaurantLogoPlaceholder;
    const iconSize = size === "row" ? 16 : 18;
    if (logoUri) {
      return (
        <Image
          source={{ uri: logoUri }}
          style={logoStyle}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[phStyle, { backgroundColor: colors.border }]}>
        <Store size={iconSize} color={colors.textSecondary} />
      </View>
    );
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={[
        styles.restaurantItem,
        {
          backgroundColor:
            selectedRestaurant?.id === item.id
              ? colors.primary + "20"
              : colors.surface,
          borderColor:
            selectedRestaurant?.id === item.id ? colors.primary : colors.border,
        },
      ]}
      onPress={() => handleSelectRestaurant(item)}
    >
      {renderRestaurantLogo(item, "list")}
      <Text
        style={[styles.restaurantName, { color: colors.text }, font]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {selectedRestaurant?.id === item.id && (
        <Check size={18} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        {selectedRestaurant ? (
          <>
            {renderRestaurantLogo(selectedRestaurant, "row")}
            <Text
              style={[styles.selectorSingleLine, { color: colors.text }, font]}
              numberOfLines={1}
            >
              {selectedRestaurant.name}
            </Text>
          </>
        ) : (
          <Text
            style={[styles.selectorSingleLine, { color: colors.textSecondary }, font]}
            numberOfLines={1}
          >
            {t("home.selectRestaurant")}
          </Text>
        )}
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }, font]}>
                {t("home.selectRestaurantTitle")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item) => item.id}
              style={styles.restaurantList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectorLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  selectorLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorSingleLine: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    borderRadius: 14,
    maxHeight: "65%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
  },
  restaurantList: {
    maxHeight: 320,
    paddingVertical: 8,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  restaurantLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  restaurantLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
  },
});
