import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useDispatch } from "react-redux";
import { PaymentModal } from "@/components/PaymentModal";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import { fetchWalletBalance, type WalletBalanceData } from "@/api/walletPaymentApi";

export default function PaymentScreen() {
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{
    restaurantId?: string;
    restaurantName?: string;
    paymentType?: "meal" | "drink";
  }>();

  const restaurantId =
    typeof params.restaurantId === "string" ? params.restaurantId : undefined;
  const restaurantName =
    typeof params.restaurantName === "string" ? params.restaurantName : undefined;
  const paymentType = params.paymentType === "drink" ? "drink" : "meal";

  const [globalWallet, setGlobalWallet] = useState<WalletBalanceData | null>(null);
  const [walletLedgerLoading, setWalletLedgerLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setWalletLedgerLoading(true);
      fetchWalletBalance()
        .then((data) => {
          if (!cancelled) {
            setGlobalWallet(data);
            setWalletLedgerLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setGlobalWallet(null);
            setWalletLedgerLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (!restaurantId) return;
    dispatch(
      setSelectedRestaurant({
        id: restaurantId,
        name: restaurantName?.trim() || "Restaurant",
        address: "",
        logo: undefined,
        userBalance: {
          walletBalance: 0,
          drinkPoints: 0,
          mealPoints: 0,
        },
      }),
    );
    dispatch(setSelectedRestaurantBalance(restaurantId));
  }, [dispatch, restaurantId, restaurantName]);

  return (
    <PaymentModal
      visible
      asScreen
      onClose={() => router.back()}
      initialPaymentType={paymentType}
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      globalWallet={globalWallet}
      walletLedgerLoading={walletLedgerLoading}
    />
  );
}

