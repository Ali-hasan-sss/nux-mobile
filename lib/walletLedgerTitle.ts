import type { WalletLedgerEntry } from "@/api/walletPaymentApi";

export type WalletLedgerPerspective = "user" | "restaurant";

/** i18n key under wallet.ledgerDesc.* — null → use generic credit/debit + source */
export function walletLedgerTitleKey(
  type: WalletLedgerEntry["type"],
  source: string,
  perspective: WalletLedgerPerspective
): string | null {
  const s = (source ?? "").toString().trim().toUpperCase();

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
    default:
      return null;
  }
}
