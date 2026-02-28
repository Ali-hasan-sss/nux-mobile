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
  id?: string;
  targetId?: string;
  userId?: string;
  restaurantId?: string;
  name?: string;
  balance: number; // Wallet balance
  stars_meal: number; // Meal points
  stars_drink: number; // Drink points
  isGroup?: boolean;
  /** Restaurant setting: points per food voucher */
  mealPointsPerVoucher?: number | null;
  /** Restaurant setting: points per drink voucher */
  drinkPointsPerVoucher?: number | null;
  /** Computed: meal points ÷ mealPointsPerVoucher (when set) */
  vouchers_meal?: number | null;
  /** Computed: drink points ÷ drinkPointsPerVoucher (when set) */
  vouchers_drink?: number | null;
  createdAt?: string;
  updatedAt?: string;
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
