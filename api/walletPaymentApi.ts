import axios from "axios";
import { authApi } from "./authApi";

/**
 * Paths relative to BASE_URL (no leading slash) so axios joins correctly with `.../api`.
 * Same router is mounted at `/client/wallet` and `/wallet` on the server.
 */
const CLIENT_WALLET = "client/wallet";
const LEGACY_WALLET = "wallet";

function is404(e: unknown): boolean {
  return axios.isAxiosError(e) && e.response?.status === 404;
}

function unwrap<T>(res: { data: { data?: T; success?: boolean; message?: string } }): T {
  const body = res.data;
  if (body?.data !== undefined) return body.data as T;
  return body as unknown as T;
}

async function runUntilNot404(
  attempts: Array<() => Promise<unknown>>
): Promise<void> {
  let last: unknown;
  for (const run of attempts) {
    try {
      await run();
      return;
    } catch (e) {
      last = e;
      if (!is404(e)) throw e;
    }
  }
  throw last;
}

export type PaymentSecurity = {
  hasPin: boolean;
  biometricEnabled: boolean;
  trustedDeviceId: string | null;
  /** From server when `deviceId` query is sent: this install has completed PIN trust once. */
  currentDeviceTrusted?: boolean;
};

export async function fetchPaymentSecurity(deviceId: string): Promise<PaymentSecurity> {
  const params = { deviceId };
  try {
    const res = await authApi.get(`${CLIENT_WALLET}/payment-security`, { params });
    return unwrap<PaymentSecurity>(res);
  } catch (e) {
    if (!is404(e)) throw e;
    const res = await authApi.get(`${LEGACY_WALLET}/payment-security`, { params });
    return unwrap<PaymentSecurity>(res);
  }
}

export type WalletBalanceData = {
  balance: string;
  currency: string;
};

export type WalletLedgerEntry = {
  id: string;
  walletId: string;
  type: "CREDIT" | "DEBIT";
  amount: string;
  status: string;
  source: string;
  referenceId: string | null;
  metadata: unknown;
  idempotencyKey: string | null;
  createdAt: string;
};

async function walletGet<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  try {
    const res = await authApi.get(`${CLIENT_WALLET}/${path}`, { params });
    return unwrap<T>(res);
  } catch (e) {
    if (!is404(e)) throw e;
    const res = await authApi.get(`${LEGACY_WALLET}/${path}`, { params });
    return unwrap<T>(res);
  }
}

async function walletPost<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await authApi.post(`${CLIENT_WALLET}/${path}`, body);
    return unwrap<T>(res);
  } catch (e) {
    if (!is404(e)) throw e;
    const res = await authApi.post(`${LEGACY_WALLET}/${path}`, body);
    return unwrap<T>(res);
  }
}

export type WalletTopUpIntentResponse = {
  clientSecret: string | null;
  paymentIntentId: string;
};

export type WalletTopUpSyncResponse = {
  applied: boolean;
  duplicate?: boolean;
};

export async function createWalletTopUpPaymentIntent(
  amountEur: number
): Promise<WalletTopUpIntentResponse> {
  return walletPost<WalletTopUpIntentResponse>("top-up/payment-intent", {
    amountEur,
  });
}

export async function syncWalletTopUpAfterPayment(
  paymentIntentId: string
): Promise<WalletTopUpSyncResponse> {
  return walletPost<WalletTopUpSyncResponse>("top-up/sync", {
    paymentIntentId,
  });
}

export async function fetchWalletBalance(): Promise<WalletBalanceData> {
  return walletGet<WalletBalanceData>("balance");
}

export async function fetchWalletTransactions(
  take = 30,
  cursor?: string
): Promise<WalletLedgerEntry[]> {
  const params: Record<string, string | number> = { take };
  if (cursor) params.cursor = cursor;
  return walletGet<WalletLedgerEntry[]>("transactions", params);
}

export async function setPaymentPin(pin: string, currentPin?: string): Promise<void> {
  const body = {
    pin,
    ...(currentPin ? { currentPin } : {}),
  };
  await runUntilNot404([
    () => authApi.post(`${CLIENT_WALLET}/payment-pin`, body),
    () => authApi.put(`${CLIENT_WALLET}/payment-pin`, body),
    () => authApi.post(`${LEGACY_WALLET}/payment-pin`, body),
    () => authApi.put(`${LEGACY_WALLET}/payment-pin`, body),
  ]);
}

export async function setPaymentBiometricEnabled(enabled: boolean): Promise<void> {
  const body = { enabled };
  await runUntilNot404([
    () => authApi.post(`${CLIENT_WALLET}/payment-biometric`, body),
    () => authApi.patch(`${CLIENT_WALLET}/payment-biometric`, body),
    () => authApi.post(`${LEGACY_WALLET}/payment-biometric`, body),
    () => authApi.patch(`${LEGACY_WALLET}/payment-biometric`, body),
  ]);
}

export type NewPaymentRequestPayload = {
  approvalId: string;
  approvalToken: string;
  restaurantId: string;
  restaurantName?: string;
  amount: string;
  currency: string;
  expiresAt: string;
  initiatedFrom: string;
};

export async function approveWalletPayment(body: {
  approvalId: string;
  approvalToken: string;
  pin?: string;
  deviceId: string;
  deviceName?: string;
}): Promise<{ userBalanceAfter: string }> {
  const res = await authApi.post(`${CLIENT_WALLET}/pay-restaurant/approve`, body);
  return unwrap<{ userBalanceAfter: string }>(res);
}

export async function rejectWalletPayment(approvalId: string): Promise<void> {
  await authApi.post(`${CLIENT_WALLET}/pay-restaurant/reject`, { approvalId });
}

export async function requestWalletPayment(payload: {
  restaurantId: string;
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  orderReference?: string;
}): Promise<NewPaymentRequestPayload> {
  const res = await authApi.post(`${CLIENT_WALLET}/pay-restaurant/request`, {
    ...payload,
    initiatedFrom: "mobile",
  });
  return unwrap<NewPaymentRequestPayload>(res);
}
