export interface RestaurantInfo {
  id: string;
  userId: string;
  name: string;
  logo: string | null;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateRestaurantInfoPayload {
  name?: string;
  logo?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface RestaurantInfoResponse {
  success: boolean;
  message: string;
  data: RestaurantInfo;
}

