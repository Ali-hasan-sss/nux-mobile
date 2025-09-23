import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { clearBalances } from "@/store/slices/balanceSlice";

export const useAuthErrorHandler = (error: any) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (error) {
      const errorMessage = error?.message || error?.toString() || "";

      // Check if it's an authentication error (not location errors)
      if (
        (errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("Token expired") ||
          errorMessage.includes("Invalid token") ||
          error?.response?.status === 401) &&
        !errorMessage.includes("You must be at the restaurant location") &&
        !errorMessage.includes("403")
      ) {
        console.log("🚪 Auto-logout due to auth error:", errorMessage);

        // Clear all data and logout
        dispatch(logout());
        dispatch(clearBalances());
      }
    }
  }, [error, dispatch]);
};
