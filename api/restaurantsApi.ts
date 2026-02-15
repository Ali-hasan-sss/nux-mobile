import api from "./axiosInstance";

export interface RestaurantListItem {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  distance?: number; // km, only from nearby endpoint
}

export interface RestaurantsResponse {
  restaurants: RestaurantListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

/**
 * GET /api/restaurants - list with pagination and optional search by name
 */
export async function getRestaurants(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<RestaurantsResponse> {
  const { page = 1, limit = 50, search } = params;
  const { data } = await api.get<{
    success: boolean;
    data: RestaurantsResponse;
  }>("/restaurants", {
    params: { page, limit, search: search || undefined },
  });
  if (!data.success || !data.data) {
    throw new Error("Failed to fetch restaurants");
  }
  return data.data;
}

/**
 * GET /api/restaurants/nearby - list by location (returns array with distance in km)
 */
export async function getNearbyRestaurants(
  params: NearbyParams
): Promise<RestaurantListItem[]> {
  const { latitude, longitude, radius = 50, limit = 50 } = params;
  const { data } = await api.get<{
    success: boolean;
    data: RestaurantListItem[];
  }>("/restaurants/nearby", {
    params: { latitude, longitude, radius, limit },
  });
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error("Failed to fetch nearby restaurants");
  }
  return data.data;
}
