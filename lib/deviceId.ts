import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "nux_wallet_device_id";

/**
 * Stable per-install device id for wallet payment approval (not a hardware ID).
 */
export async function getOrCreateWalletDeviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
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
