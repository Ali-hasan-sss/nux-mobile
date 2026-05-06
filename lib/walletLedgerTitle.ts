import type { WalletLedgerEntry } from "@/api/walletPaymentApi";

export type WalletLedgerPerspective = "user" | "restaurant";

/** Promo credit from limited-time top-up campaigns (ledger source BONUS). */
export function isWalletLedgerPromoBonus(
  type: WalletLedgerEntry["type"],
  source: string,
): boolean {
  const s = (source ?? "").toString().trim().toUpperCase();
  return type === "CREDIT" && s === "BONUS";
}

/** i18n key under wallet.ledgerDesc.* — null → use generic credit/debit + source */
export function walletLedgerTitleKey(
  type: WalletLedgerEntry["type"],
  source: string,
  perspective: WalletLedgerPerspective,
  metadata?: unknown
): string | null {
  const s = (source ?? "").toString().trim().toUpperCase();
  const giftType =
    metadata && typeof metadata === "object" && "giftType" in metadata
      ? String((metadata as { giftType?: unknown }).giftType ?? "")
          .trim()
          .toUpperCase()
      : "";

  if (perspective === "user" && s === "ADMIN" && giftType === "MONEY_VOUCHER") {
    if (type === "DEBIT") return "wallet.ledgerDesc.giftVoucherSent";
    if (type === "CREDIT") return "wallet.ledgerDesc.giftVoucherReceived";
  }

  switch (s) {
    case "ORDER":
      if (perspective === "restaurant" && type === "CREDIT") return "wallet.ledgerDesc.restaurantOrderCredit";
      if (perspective === "user" && type === "DEBIT") return "wallet.ledgerDesc.userOrderDebit";
      if (perspective === "user" && type === "CREDIT") return "wallet.ledgerDesc.userOrderCredit";
      if (perspective === "restaurant" && type === "DEBIT") return "wallet.ledgerDesc.restaurantOrderDebit";
      return null;
    case "STRIPE":
      if (type !== "CREDIT") return null;
      return perspective === "restaurant"
        ? "wallet.ledgerDesc.topUpCardRestaurant"
        : "wallet.ledgerDesc.topUpCardUser";
    case "PAYPAL":
      if (type === "CREDIT") return "wallet.ledgerDesc.topUpPaypal";
      return null;
    case "WITHDRAWAL":
      if (type === "DEBIT") return "wallet.ledgerDesc.withdrawalDebit";
      return null;
    case "ADMIN":
      if (type === "CREDIT") return "wallet.ledgerDesc.adminCredit";
      if (type === "DEBIT") return "wallet.ledgerDesc.adminDebit";
      return null;
    case "BONUS":
      if (type === "CREDIT") return "wallet.ledgerDesc.promoTopUpGift";
      return null;
    default:
      return null;
  }
}
