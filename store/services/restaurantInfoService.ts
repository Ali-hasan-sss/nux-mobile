import api from "@/api/axiosInstance";
import {
  RestaurantInfoResponse,
  UpdateRestaurantInfoPayload,
} from "../types/restaurantInfoTypes";

export const restaurantInfoService = {
  // Get restaurant info
  async getRestaurantInfo(): Promise<RestaurantInfoResponse> {
    try {
      const response = await api.get<RestaurantInfoResponse>(
        "/restaurants/account/me"
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching restaurant info:", error);
      throw error;
    }
  },

  // Update restaurant info
  async updateRestaurantInfo(
    data: UpdateRestaurantInfoPayload
  ): Promise<RestaurantInfoResponse> {
    try {
      const response = await api.put<RestaurantInfoResponse>(
        "/restaurants/account/update",
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating restaurant info:", error);
      throw error;
    }
  },
};
