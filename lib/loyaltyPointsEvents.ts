import { DeviceEventEmitter } from "react-native";

export type LoyaltyPointsKind = "meal" | "drink";

export type LoyaltyPointsEarnedPayload = {
  type: LoyaltyPointsKind;
  delta?: number;
  fromPoints?: number;
  restaurantId?: string | null;
};

const EVENT = "loyalty:pointsEarned";

let pending: LoyaltyPointsEarnedPayload | null = null;

export function emitLoyaltyPointsEarned(payload: LoyaltyPointsEarnedPayload) {
  pending = {
    type: payload.type === "drink" ? "drink" : "meal",
    delta: Math.max(1, Number(payload.delta) || 1),
    fromPoints:
      payload.fromPoints == null ? undefined : Math.max(0, Number(payload.fromPoints) || 0),
    restaurantId: payload.restaurantId ?? null,
  };
  DeviceEventEmitter.emit(EVENT, pending);
}

export function consumePendingLoyaltyPointsEarned(): LoyaltyPointsEarnedPayload | null {
  const next = pending;
  pending = null;
  return next;
}
