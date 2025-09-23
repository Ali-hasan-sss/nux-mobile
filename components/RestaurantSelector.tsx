import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, X } from "lucide-react-native";
import { RootState } from "@/store/store";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
import { useTheme } from "@/hooks/useTheme";
import { Restaurant as BalanceRestaurant } from "@/store/types/balanceTypes";

export interface Restaurant extends BalanceRestaurant {
  userBalance?: {
    walletBalance: number;
    drinkPoints: number;
    mealPoints: number;
  };
}

export const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Café Central",
    address: "123 Coffee Street, Downtown",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 150.75,
      drinkPoints: 25,
      mealPoints: 12,
    },
  },
  {
    id: "2",
    name: "Pizza Palace",
    address: "456 Italian Avenue, City Center",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 89.5,
      drinkPoints: 18,
      mealPoints: 8,
    },
  },
  {
    id: "3",
    name: "Burger Barn",
    address: "789 Grill Road, Food District",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 203.25,
      drinkPoints: 32,
      mealPoints: 15,
    },
  },
  {
    id: "4",
    name: "Sushi House",
    address: "321 Asian Street, Food District",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 120.5,
      drinkPoints: 20,
      mealPoints: 10,
    },
  },
  {
    id: "5",
    name: "Taco Fiesta",
    address: "654 Mexican Avenue, Food District",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 95.75,
      drinkPoints: 15,
      mealPoints: 7,
    },
  },
  {
    id: "6",
    name: "Pasta Corner",
    address: "987 Italian Road, Food District",
    latitude: 36.020214,
    longitude: 35.0134549,
    isActive: true,
    createdAt: new Date().toISOString(),
    userBalance: {
      walletBalance: 180.25,
      drinkPoints: 28,
      mealPoints: 14,
    },
  },
];

interface RestaurantSelectorProps {
  restaurants?: Restaurant[];
  onRestaurantChange?: (restaurant: Restaurant) => void;
}

export function RestaurantSelector({
  restaurants = mockRestaurants,
  onRestaurantChange,
}: RestaurantSelectorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // Convert to restaurantSlice format by ensuring userBalance is defined
    const restaurantForSlice = {
      ...restaurant,
      userBalance: restaurant.userBalance || {
        walletBalance: 0,
        drinkPoints: 0,
        mealPoints: 0,
      },
    };
    dispatch(setSelectedRestaurant(restaurantForSlice));
    onRestaurantChange?.(restaurant);
    setModalVisible(false);
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
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.restaurantAddress, { color: colors.textSecondary }]}
        >
          {item.address}
        </Text>
      </View>
      {selectedRestaurant?.id === item.id && (
        <Check size={20} color={colors.primary} />
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
      >
        <View style={styles.selectorContent}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Restaurant
          </Text>
          <Text style={[styles.selectedText, { color: colors.text }]}>
            {selectedRestaurant?.name || "Select Restaurant"}
          </Text>
        </View>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Restaurant
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
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
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectorContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  restaurantList: {
    maxHeight: 400,
  },
  restaurantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
  },
});
