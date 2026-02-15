export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'RESTAURANT_OWNER' | 'USER';
  emailVerified?: boolean;
  restaurantName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  isSubscriptionActive: boolean;
  subscription?: {
    planName: string;
    price: number;
    endDate: string;
    status: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  restaurant: Restaurant | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface RegisterRestaurantRequest {
  email: string;
  password: string;
  fullName: string;
  restaurantName: string;
  address: string;
  latitude: number;
  longitude: number;
  logo?: string;
}

export interface AuthResponse {
  user: User;
  restaurant?: Restaurant;
  tokens: AuthTokens;
}
