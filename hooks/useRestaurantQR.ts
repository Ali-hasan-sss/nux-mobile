import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import {
  fetchRestaurantInfo,
  regenerateQRCodes,
  setAutoRefresh,
} from "@/store/slices/restaurantQRSlice";

export const useRestaurantQR = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { info, loading, error, autoRefreshEnabled } = useSelector(
    (state: RootState) => state.restaurantQR
  );

  const loadRestaurantInfo = useCallback(() => {
    dispatch(fetchRestaurantInfo());
  }, [dispatch]);

  const regenerateQR = useCallback(async () => {
    await dispatch(regenerateQRCodes());
  }, [dispatch]);

  const toggleAutoRefresh = useCallback(
    (enabled: boolean) => {
      dispatch(setAutoRefresh(enabled));
    },
    [dispatch]
  );

  return {
    restaurantInfo: info,
    loading,
    error,
    autoRefreshEnabled,
    loadRestaurantInfo,
    regenerateQR,
    toggleAutoRefresh,
  };
};
