// Balance Types for Mobile App

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  logo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserRestaurantBalance {
  id: string;
  userId: string;
  restaurantId: string;
  balance: number; // Wallet balance
  stars_meal: number; // Meal points
  stars_drink: number; // Drink points
  createdAt: string;
  updatedAt: string;
  restaurant?: Restaurant;
}

export interface BalanceState {
  userBalances: UserRestaurantBalance[];
  selectedRestaurantBalance: UserRestaurantBalance | null;
  loading: {
    balances: boolean;
    qrScan: boolean;
    payment: boolean;
  };
  error: {
    balances: string | null;
    qrScan: string | null;
    payment: string | null;
  };
}

export interface BalancesApiResponse {
  success: boolean;
  message: string;
  data: UserRestaurantBalance[];
}

export interface QrScanData {
  qrCode: string;
  latitude: number;
  longitude: number;
}

export interface PaymentData {
  targetId: string;
  currencyType: 'balance' | 'stars_meal' | 'stars_drink';
  amount: number;
}

export interface QrScanApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PaymentApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
