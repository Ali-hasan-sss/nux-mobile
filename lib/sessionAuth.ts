import { router } from "expo-router";
import { CrossPlatformStorage } from "@/store/services/crossPlatformStorage";
import { logout } from "@/store/slices/authSlice";
import { clearBalances } from "@/store/slices/balanceSlice";

export { SessionExpiredError, SESSION_EXPIRED_CODE, isSessionExpiredError } from "./sessionExpired";

let sessionExpiryInProgress = false;

/** Clear session and navigate to login (idempotent). */
export async function handleSessionExpired(): Promise<void> {
  if (sessionExpiryInProgress) return;
  sessionExpiryInProgress = true;

  try {
    await CrossPlatformStorage.clearAll();
    const { store } = await import("@/store/store");
    try {
      await store.dispatch(logout()).unwrap();
    } catch {
      // Ensure Redux auth state is cleared even if thunk fails after storage clear
    }
    store.dispatch(clearBalances());
    router.replace("/auth/login");
  } catch (e) {
    console.error("handleSessionExpired:", e);
    router.replace("/auth/login");
  } finally {
    setTimeout(() => {
      sessionExpiryInProgress = false;
    }, 800);
  }
}
