import api from "@/api/axiosInstance";
import { RestaurantResponse } from "../types/restaurantTypes";

export const restaurantQRService = {
  // Get restaurant info including QR codes
  async getRestaurantInfo(): Promise<RestaurantResponse> {
    try {
      const response = await api.get<RestaurantResponse>(
        "/restaurants/account/me"
      );
      console.log("📡 RestaurantQRService: API Response:", {
        success: response.data.success,
        hasData: !!response.data.data,
        qrCode_drink: response.data.data?.qrCode_drink,
        qrCode_meal: response.data.data?.qrCode_meal,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching restaurant info:", error);
      throw error;
    }
  },

  // Regenerate QR codes (drink and meal)
  async regenerateQRCodes(): Promise<RestaurantResponse> {
    try {
      const response = await api.put<RestaurantResponse>(
        "/restaurants/account/qr/regenerate"
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error regenerating QR codes:", error);
      throw error;
    }
  },
};
