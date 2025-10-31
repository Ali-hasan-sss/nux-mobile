import api from "@/api/axiosInstance";
import {
  QRScansResponse,
  PaymentsResponse,
} from "../types/restaurantActivityTypes";

export const restaurantActivityService = {
  // Get QR scans for restaurant
  async getQRScans(
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      type?: "drink" | "meal";
    } = {}
  ): Promise<QRScansResponse> {
    try {
      const response = await api.get<QRScansResponse>("/restaurants/qr-scans", {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching QR scans:", error);
      throw error;
    }
  },

  // Get payments for restaurant
  async getPayments(
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      paymentType?: "balance" | "stars_meal" | "stars_drink";
    } = {}
  ): Promise<PaymentsResponse> {
    try {
      const response = await api.get<PaymentsResponse>(
        "/restaurants/payments",
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 10,
            ...params,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching payments:", error);
      throw error;
    }
  },
};
