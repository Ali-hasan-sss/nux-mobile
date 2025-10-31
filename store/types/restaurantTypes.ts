export interface RestaurantQRCodes {
  qrCode_drink: string;
  qrCode_meal: string;
}

export interface RestaurantInfo {
  id: string;
  userId: string;
  name: string;
  logo: string | null;
  address: string;
  latitude: number;
  longitude: number;
  qrCode_drink: string;
  qrCode_meal: string;
  isSubscriptionActive: boolean;
  isActive: boolean;
  createdAt: string;
  group?: {
    id: string;
    name: string;
    description: string;
    role: "OWNER" | "MEMBER";
  } | null;
  permissions?: any;
}

export interface RestaurantState {
  info: RestaurantInfo | null;
  loading: boolean;
  error: string | null;
  autoRefreshEnabled: boolean;
}

export interface RestaurantResponse {
  success: boolean;
  message: string;
  data: RestaurantInfo;
}
