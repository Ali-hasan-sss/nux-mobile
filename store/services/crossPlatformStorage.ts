import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthTokens, User, Restaurant } from '../types/authTypes';

// Keys for storage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  RESTAURANT_DATA: 'restaurant_data',
} as const;

// Cross-platform storage helpers
const isWeb = Platform.OS === 'web';

const setItem = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItem = async (key: string): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export class CrossPlatformStorage {
  // Token management
  static async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      ]);
      console.log(
        `✅ Tokens saved (${isWeb ? 'Web AsyncStorage' : 'Native SecureStore'})`
      );
    } catch (error) {
      console.error('❌ Failed to save tokens:', error);
      throw error;
    }
  }

  static async getTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        getItem(STORAGE_KEYS.ACCESS_TOKEN),
        getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get tokens:', error);
      return null;
    }
  }

  static async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
        deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      console.log('✅ Tokens cleared');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  // User data management
  static async saveUser(user: User): Promise<void> {
    try {
      await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      console.log('✅ User data saved');
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      throw error;
    }
  }

  static async getUser(): Promise<User | null> {
    try {
      const userData = await getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      return null;
    }
  }

  static async clearUser(): Promise<void> {
    try {
      await deleteItem(STORAGE_KEYS.USER_DATA);
      console.log('✅ User data cleared');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
    }
  }

  // Restaurant data management
  static async saveRestaurant(restaurant: Restaurant): Promise<void> {
    try {
      await setItem(STORAGE_KEYS.RESTAURANT_DATA, JSON.stringify(restaurant));
      console.log('✅ Restaurant data saved');
    } catch (error) {
      console.error('❌ Failed to save restaurant data:', error);
      throw error;
    }
  }

  static async getRestaurant(): Promise<Restaurant | null> {
    try {
      const restaurantData = await getItem(STORAGE_KEYS.RESTAURANT_DATA);
      if (restaurantData) {
        return JSON.parse(restaurantData);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get restaurant data:', error);
      return null;
    }
  }

  static async clearRestaurant(): Promise<void> {
    try {
      await deleteItem(STORAGE_KEYS.RESTAURANT_DATA);
      console.log('✅ Restaurant data cleared');
    } catch (error) {
      console.error('❌ Failed to clear restaurant data:', error);
    }
  }

  // Clear all stored data
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearTokens(),
        this.clearUser(),
        this.clearRestaurant(),
      ]);
      console.log('✅ All data cleared');
    } catch (error) {
      console.error('❌ Failed to clear all data:', error);
    }
  }

  // Check if user session exists
  static async hasValidSession(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      const user = await this.getUser();
      return !!(tokens?.accessToken && tokens?.refreshToken && user);
    } catch (error) {
      console.error('❌ Failed to check session:', error);
      return false;
    }
  }
}
