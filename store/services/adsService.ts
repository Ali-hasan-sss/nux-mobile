import api from "@/api/axiosInstance";
import { AdsResponse, AdsFilters } from "../types/adsTypes";

export const adsService = {
  // Get all ads with filters and pagination (for users)
  async getAds(filters: AdsFilters = {}): Promise<AdsResponse> {
    try {
      const params: any = {
        page: filters.page || 1,
        pageSize: filters.pageSize || 10,
      };

      // Add search query
      if (filters.search?.trim()) {
        params.search = filters.search.trim();
      }

      // Add category filter
      if (filters.category) {
        params.category = filters.category;
      }

      // Add location filters
      if (
        filters.lat !== undefined &&
        filters.lng !== undefined &&
        filters.radius !== undefined
      ) {
        params.lat = filters.lat;
        params.lng = filters.lng;
        params.radius = filters.radius;
      }

      const response = await api.get<AdsResponse>("/ads", { params });
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching ads:", error);
      throw error;
    }
  },

  // Get restaurant's own ads (for restaurant owners)
  async getRestaurantAds(): Promise<AdsResponse> {
    try {
      const response = await api.get<AdsResponse>("/restaurants/ads/my");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching restaurant ads:", error);
      throw error;
    }
  },

  // Create new ad (for restaurant owners)
  async createAd(adData: {
    title: string;
    description?: string;
    image: string;
    category?: string;
  }): Promise<any> {
    try {
      const response = await api.post("/restaurants/ads", adData);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating ad:", error);
      throw error;
    }
  },

  // Delete ad (for restaurant owners)
  async deleteAd(adId: number): Promise<any> {
    try {
      const response = await api.delete(`/restaurants/ads/${adId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting ad:", error);
      throw error;
    }
  },
};
