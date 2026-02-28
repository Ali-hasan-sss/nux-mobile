import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { RootState, AppDispatch } from "@/store/store";
import {
  fetchUserBalances,
  setSelectedRestaurantBalance,
  clearErrors,
  clearBalances,
} from "@/store/slices/balanceSlice";
import { updateSelectedRestaurantFromBalance } from "@/store/slices/restaurantSlice";
import { Restaurant } from "@/store/types/balanceTypes";
import { useAuthErrorHandler } from "./useAuthErrorHandler";

export const useBalance = () => {
  const dispatch = useDispatch<AppDispatch>();
  const balance = useSelector((state: RootState) => state.balance);
  const auth = useSelector((state: RootState) => state.auth);
  const selectedRestaurant = useSelector(
    (state: RootState) => state.restaurant.selectedRestaurant
  );

  // Handle auth errors automatically (but not QR scan location errors)
  useAuthErrorHandler(balance.error.balances || balance.error.payment);

  // Get all restaurants with balances (even if balance is 0)
  const restaurantsWithBalances = balance.userBalances
    .map((balanceItem) => balanceItem.restaurant)
    .filter(Boolean) as Restaurant[];

  // Get current selected restaurant balance (with voucher fields like website)
  const currentBalance = (() => {
    const bal = balance.selectedRestaurantBalance;
    if (!bal) {
      return {
        walletBalance: 0,
        drinkPoints: 0,
        mealPoints: 0,
        mealVouchers: 0,
        drinkVouchers: 0,
        mealPerVoucher: 1,
        drinkPerVoucher: 1,
        mealTowardNext: 0,
        drinkTowardNext: 0,
      };
    }
    const mealVouchers = bal.vouchers_meal ?? 0;
    const drinkVouchers = bal.vouchers_drink ?? 0;
    const mealPerVoucher = bal.mealPointsPerVoucher || 1;
    const drinkPerVoucher = bal.drinkPointsPerVoucher || 1;
    const mealStars = bal.stars_meal ?? 0;
    const drinkStars = bal.stars_drink ?? 0;
    const mealTowardNext = mealPerVoucher > 0
      ? Math.min(mealStars - mealVouchers * mealPerVoucher, mealPerVoucher)
      : 0;
    const drinkTowardNext = drinkPerVoucher > 0
      ? Math.min(drinkStars - drinkVouchers * drinkPerVoucher, drinkPerVoucher)
      : 0;
    return {
      walletBalance: bal.balance ?? 0,
      drinkPoints: drinkStars,
      mealPoints: mealStars,
      mealVouchers,
      drinkVouchers,
      mealPerVoucher,
      drinkPerVoucher,
      mealTowardNext,
      drinkTowardNext,
    };
  })();

  // Actions
  const loadBalances = useCallback(() => {
    if (auth.isAuthenticated) {
      dispatch(fetchUserBalances());
    }
  }, [auth.isAuthenticated, dispatch]);

  const selectRestaurant = (restaurantId: string) => {
    dispatch(setSelectedRestaurantBalance(restaurantId));
  };

  const clearBalanceErrors = () => {
    dispatch(clearErrors());
  };

  const resetBalances = () => {
    dispatch(clearBalances());
  };

  const refreshBalances = useCallback(() => {
    if (auth.isAuthenticated) {
      console.log("🔄 Refreshing balances after QR scan...");
      dispatch(fetchUserBalances()).then((result) => {
        // The balanceSlice will automatically update selectedRestaurantBalance
        // Now we need to update the restaurantSlice as well
        if (
          result.payload &&
          Array.isArray(result.payload) &&
          selectedRestaurant
        ) {
          const updatedBalance = result.payload.find(
            (item: any) => item.targetId === selectedRestaurant.id
          );

          if (updatedBalance) {
            dispatch(
              updateSelectedRestaurantFromBalance({
                restaurantId: updatedBalance.targetId,
                balance: updatedBalance.balance,
                stars_meal: updatedBalance.stars_meal,
                stars_drink: updatedBalance.stars_drink,
              })
            );
            console.log(
              "✅ Updated selected restaurant balance:",
              updatedBalance
            );
          }
        }
      });
    }
  }, [auth.isAuthenticated, dispatch, selectedRestaurant]);

  return {
    // State
    userBalances: balance.userBalances,
    selectedRestaurantBalance: balance.selectedRestaurantBalance,
    restaurantsWithBalances,
    currentBalance,
    loading: balance.loading,
    error: balance.error,

    // Actions
    loadBalances,
    selectRestaurant,
    clearBalanceErrors,
    resetBalances,
    refreshBalances,
  };
};
