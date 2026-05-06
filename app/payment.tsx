import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useDispatch } from "react-redux";
import { PaymentModal } from "@/components/PaymentModal";
import { setSelectedRestaurant } from "@/store/slices/restaurantSlice";
import { setSelectedRestaurantBalance } from "@/store/slices/balanceSlice";
import { fetchWalletBalance, type WalletBalanceData } from "@/api/walletPaymentApi";

/** Expo Router may pass a single string or string[] for the same query key. */
function coerceQueryParam(
  v: string | string[] | undefined
): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t.length > 0) return t;
      }
    }
  }
  return undefined;
}

export default function PaymentScreen() {
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{
    restaurantId?: string | string[];
    restaurantName?: string | string[];
    paymentType?: string | string[];
  }>();

  const restaurantId = coerceQueryParam(params.restaurantId);
  const restaurantName = coerceQueryParam(params.restaurantName);
  const paymentType =
    coerceQueryParam(params.paymentType) === "drink" ? "drink" : "meal";

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

