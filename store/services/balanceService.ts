import { API_CONFIG } from "../../config/api";
import { authApi } from "../../api/authApi";
import {
  BalancesApiResponse,
  QrScanApiResponse,
  PaymentApiResponse,
  QrScanData,
  PaymentData,
} from "../types/balanceTypes";

class BalanceService {
  // Get user balances for all restaurants
  async getUserBalances(): Promise<BalancesApiResponse> {
    try {
      console.log(
        "🔍 Fetching balances from:",
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLIENT.BALANCE}`
      );

      const response = await authApi.get(API_CONFIG.ENDPOINTS.CLIENT.BALANCE);

      if (__DEV__) {
        console.log("📊 User Balances Response:", response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to fetch user balances:", error);

      // Log more details about the error
      if (error.response) {
        console.error("❌ Error response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error("❌ No response received:", error.request);
      } else {
        console.error("❌ Error setting up request:", error.message);
      }

      throw error;
    }
  }

  // Scan QR code and process payment
  async scanQrCode(qrData: QrScanData): Promise<QrScanApiResponse> {
    try {
      console.log("📱 Scanning QR code with data:", qrData);

      const response = await authApi.post(
        API_CONFIG.ENDPOINTS.CLIENT.SCAN_QR,
        qrData
      );

      if (__DEV__) {
        console.log("📱 QR Scan Response:", response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to scan QR code:", error);

      // Log more details about the error
      if (error.response) {
        console.error("❌ Error response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      // For development, provide more specific error messages
      if (__DEV__ && error.response?.status === 403) {
        const locationError = new Error(
          "You must be at the restaurant location to scan this QR"
        );
        (locationError as any).response = error.response;
        throw locationError;
      }

      throw error;
    }
  }

  // Process payment
  async processPayment(paymentData: PaymentData): Promise<PaymentApiResponse> {
    try {
      const response = await authApi.post(
        API_CONFIG.ENDPOINTS.CLIENT.PAY,
        paymentData
      );

      if (__DEV__) {
        console.log("💳 Payment Response:", response.data);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Failed to process payment:", error);
      throw error;
    }
  }
}

export const balanceService = new BalanceService();
