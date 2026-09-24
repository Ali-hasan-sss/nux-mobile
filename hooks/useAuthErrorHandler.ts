import { useEffect } from "react";
import {
  handleSessionExpired,
  isSessionExpiredError,
} from "@/lib/sessionAuth";

export const useAuthErrorHandler = (error: unknown) => {
  useEffect(() => {
    if (!error) return;

    if (isSessionExpiredError(error)) {
      void handleSessionExpired();
      return;
    }

    const errorMessage =
      (error as Error)?.message || String(error);

    if (
      (errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("Token expired") ||
        errorMessage.includes("Invalid token") ||
        errorMessage.includes("No refresh token") ||
        (error as { response?: { status?: number } })?.response?.status ===
          401) &&
      !errorMessage.includes("You must be at the restaurant location") &&
      !errorMessage.includes("403")
    ) {
      void handleSessionExpired();
    }
  }, [error]);
};
