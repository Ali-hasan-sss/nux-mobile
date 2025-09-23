import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  userBalance: {
    walletBalance: number;
    drinkPoints: number;
    mealPoints: number;
  };
}

interface RestaurantState {
  selectedRestaurant: Restaurant | null;
  restaurants: Restaurant[];
}

const initialState: RestaurantState = {
  selectedRestaurant: null,
  restaurants: [],
};

const restaurantSlice = createSlice({
  name: "restaurant",
  initialState,
  reducers: {
    setSelectedRestaurant: (state, action: PayloadAction<Restaurant>) => {
      state.selectedRestaurant = action.payload;
    },
    setRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
      state.restaurants = action.payload;
    },
    updateRestaurantBalance: (
      state,
      action: PayloadAction<{
        restaurantId: string;
        balanceType: "walletBalance" | "drinkPoints" | "mealPoints";
        amount: number;
      }>
    ) => {
      const { restaurantId, balanceType, amount } = action.payload;

      // Update in restaurants array
      const restaurant = state.restaurants.find((r) => r.id === restaurantId);
      if (restaurant) {
        restaurant.userBalance[balanceType] = amount;
      }

      // Update selected restaurant if it matches
      if (state.selectedRestaurant?.id === restaurantId) {
        state.selectedRestaurant.userBalance[balanceType] = amount;
      }
    },
    updateSelectedRestaurantFromBalance: (
      state,
      action: PayloadAction<{
        restaurantId: string;
        balance: number;
        stars_meal: number;
        stars_drink: number;
      }>
    ) => {
      const { restaurantId, balance, stars_meal, stars_drink } = action.payload;

      // Update selected restaurant if it matches
      if (state.selectedRestaurant?.id === restaurantId) {
        state.selectedRestaurant.userBalance = {
          walletBalance: balance,
          mealPoints: stars_meal,
          drinkPoints: stars_drink,
        };
      }
    },
  },
});

export const {
  setSelectedRestaurant,
  setRestaurants,
  updateRestaurantBalance,
  updateSelectedRestaurantFromBalance,
} = restaurantSlice.actions;
export default restaurantSlice;
