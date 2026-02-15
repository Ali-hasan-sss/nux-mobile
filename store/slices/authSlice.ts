import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  AuthState,
  AuthTokens,
  LoginRequest,
  RegisterUserRequest,
  User,
} from "../types/authTypes";
import { authService } from "../services/authService";
import { CrossPlatformStorage } from "../services/crossPlatformStorage";

// Initial state
const initialState: AuthState = {
  user: null,
  restaurant: null,
  tokens: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      // Save to secure storage (customer app: no restaurant data)
      await CrossPlatformStorage.saveTokens(response.tokens);
      await CrossPlatformStorage.saveUser(response.user);

      return response;
    } catch (error: any) {
      console.error("❌ Login error in slice:", error);

      let errorMessage = "Login failed";

      if (error.message?.includes("Network Error")) {
        errorMessage = "Network Error - Please check your internet connection";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData: RegisterUserRequest, { rejectWithValue }) => {
    try {
      const response = await authService.registerUser(userData);

      // Save to secure storage
      await CrossPlatformStorage.saveTokens(response.tokens);
      await CrossPlatformStorage.saveUser(response.user);

      return response;
    } catch (error: any) {
      console.error("❌ User registration error in slice:", error);

      let errorMessage = "Registration failed";

      if (error.message?.includes("Network Error")) {
        errorMessage = "Network Error - Please check your internet connection";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const registerRestaurant = createAsyncThunk(
  "auth/registerRestaurant",
  async (restaurantData: RegisterRestaurantRequest, { rejectWithValue }) => {
    try {
      const response = await authService.registerRestaurant(restaurantData);

      // Save to secure storage
      await CrossPlatformStorage.saveTokens(response.tokens);
      await CrossPlatformStorage.saveUser(response.user);
      if (response.restaurant) {
        await CrossPlatformStorage.saveRestaurant(response.restaurant);
      }

      return response;
    } catch (error: any) {
      console.error("❌ Restaurant registration error in slice:", error);

      let errorMessage = "Restaurant registration failed";

      if (error.message?.includes("Network Error")) {
        errorMessage = "Network Error - Please check your internet connection";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Initialize auth state from secure storage
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Initializing auth from secure storage...");

      const [tokens, user, restaurant] = await Promise.all([
        CrossPlatformStorage.getTokens(),
        CrossPlatformStorage.getUser(),
        CrossPlatformStorage.getRestaurant(),
      ]);

      if (tokens && user) {
        console.log("✅ Found existing session for:", user.email);
        return { user, restaurant, tokens };
      } else {
        console.log("ℹ️ No existing session found");
        return null;
      }
    } catch (error: any) {
      console.error("❌ Failed to initialize auth:", error);

      let errorMessage = "Failed to initialize authentication";

      if (error.message?.includes("Network Error")) {
        errorMessage = "Network Error - Please check your internet connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🚪 Logging out...");
      await CrossPlatformStorage.clearAll();
      console.log("✅ Logout successful");
      return null;
    } catch (error: any) {
      console.error("❌ Logout error:", error);

      let errorMessage = "Logout failed";

      if (error.message?.includes("Network Error")) {
        errorMessage = "Network Error - Please check your internet connection";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      // Save to secure storage in background
      CrossPlatformStorage.saveTokens(action.payload).catch(console.error);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Save updated user to secure storage
        CrossPlatformStorage.saveUser(state.user).catch(console.error);
      }
    },
    setEmailVerified: (state) => {
      if (state.user) {
        state.user.emailVerified = true;
        CrossPlatformStorage.saveUser(state.user).catch(console.error);
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        console.log("🔄 Initializing auth...");
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.restaurant = action.payload.restaurant;
          state.tokens = action.payload.tokens;
          state.isAuthenticated = true;
          console.log("✅ Auth initialized successfully");
        } else {
          console.log("ℹ️ No existing session found");
        }
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;

        // Log the error for debugging
        console.error("❌ Initialize auth rejected:", action.payload);
        console.log("⚠️ Auth initialization failed");
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("🔄 Logging in user...");
        state.isAuthenticated = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.restaurant = action.payload.restaurant || null;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
        console.log("✅ User login successful");
        console.log("👤 User:", action.payload.user?.email);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;

        // Log the error for debugging
        console.error("❌ Login user rejected:", action.payload);
        console.log("⚠️ User login failed");
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("🔄 Registering user...");
        state.isAuthenticated = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
        console.log("✅ User registration successful");
        console.log("👤 User:", action.payload.user?.email);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;

        // Log the error for debugging
        console.error("❌ Register user rejected:", action.payload);
        console.log("⚠️ User registration failed");
      });

    // Register restaurant
    builder
      .addCase(registerRestaurant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("🔄 Registering restaurant...");
        state.isAuthenticated = false;
      })
      .addCase(registerRestaurant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.restaurant = action.payload.restaurant || null;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
        console.log("✅ Restaurant registration successful");
        console.log("👤 User:", action.payload.user?.email);
        console.log("🏪 Restaurant:", action.payload.restaurant?.name);
      })
      .addCase(registerRestaurant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;

        // Log the error for debugging
        console.error("❌ Register restaurant rejected:", action.payload);
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        console.log("🔄 Logging out...");
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.restaurant = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log("✅ Logout successful");
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Force logout even if it failed
        state.user = null;
        state.restaurant = null;
        state.tokens = null;
        state.isAuthenticated = false;

        // Log the error for debugging
        console.error("❌ Logout rejected:", action.payload);
        console.log("⚠️ Forced logout due to error");
      });
  },
});

export const { clearError, setTokens, updateUser, setEmailVerified } = authSlice.actions;
export default authSlice;
