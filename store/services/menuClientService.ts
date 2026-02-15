import { API_CONFIG } from "@/config/api";
import axios from "axios";

const publicApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

export interface MenuCategory {
  id: number;
  title: string;
  description?: string;
  image?: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: number;
  title: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: number;
  preparationTime?: number;
  extras?: { name: string; price?: number; calories?: number }[];
  discountType?: string;
  discountValue?: number;
  allergies?: string[];
  calories?: number;
  kitchenSection?: { id: number; name: string; description?: string };
  createdAt: string;
  updatedAt: string;
}

export interface MenuRestaurantInfo {
  name: string | null;
  logo: string | null;
}

export interface MenuCategoriesResponse {
  success: boolean;
  data: MenuCategory[];
  restaurant?: MenuRestaurantInfo;
}

export interface MenuItemsResponse {
  success: boolean;
  data: MenuItem[];
}

export const menuClientService = {
  getCategoriesByQRCode: async (
    qrCode: string
  ): Promise<MenuCategoriesResponse> => {
    const res = await publicApi.get<MenuCategoriesResponse>(
      `${API_CONFIG.ENDPOINTS.MENU.GET_CATEGORIES}/${qrCode}`
    );
    return res.data;
  },

  getItemsByCategory: async (
    categoryId: number
  ): Promise<MenuItemsResponse> => {
    const res = await publicApi.get<MenuItemsResponse>(
      `${API_CONFIG.ENDPOINTS.MENU.GET_ITEMS}/${categoryId}`
    );
    return res.data;
  },
};
