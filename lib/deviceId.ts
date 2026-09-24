import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "nux_client_device_id";
const LEGACY_STORAGE_KEY = "nux_wallet_device_id";

/**
 * Stable per-install client id (rate limits, wallet PIN trust). Not a hardware ID.
 */
export async function getOrCreateClientDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const legacy = await SecureStore.getItemAsync(LEGACY_STORAGE_KEY);
    if (legacy && legacy.length >= 8) {
      await SecureStore.setItemAsync(STORAGE_KEY, legacy);
      return legacy;
    }
  } catch {
    /* fall through */
  }
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}_${Math.random().toString(36).slice(2, 18)}`;
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, id);
  } catch {
    /* still return ephemeral id for this session */
  }
  return id;
}

/** @deprecated Use getOrCreateClientDeviceId */
export async function getOrCreateWalletDeviceId(): Promise<string> {
  return getOrCreateClientDeviceId();
}
