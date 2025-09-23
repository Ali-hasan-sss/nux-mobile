import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { balanceService } from "../services/balanceService";
import {
  BalanceState,
  UserRestaurantBalance,
  QrScanData,
  PaymentData,
} from "../types/balanceTypes";

// Initial state
const initialState: BalanceState = {
  userBalances: [],
  selectedRestaurantBalance: null,
  loading: {
    balances: false,
    qrScan: false,
    payment: false,
  },
  error: {
    balances: null,
    qrScan: null,
    payment: null,
  },
};

// Async thunks
export const fetchUserBalances = createAsyncThunk(
  "balance/fetchUserBalances",
  async (_, { rejectWithValue }) => {
    try {
      const response = await balanceService.getUserBalances();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch balances");
    }
  }
);

export const scanQrCode = createAsyncThunk(
  "balance/scanQrCode",
  async (qrData: QrScanData, { rejectWithValue }) => {
    try {
      const response = await balanceService.scanQrCode(qrData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to scan QR code");
    }
  }
);

export const processPayment = createAsyncThunk(
  "balance/processPayment",
  async (paymentData: PaymentData, { rejectWithValue }) => {
    try {
      const response = await balanceService.processPayment(paymentData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to process payment");
    }
  }
);

export const giftPoints = createAsyncThunk(
  "balance/giftPoints",
  async (giftData: PaymentData & { qrCode: string }, { rejectWithValue }) => {
    try {
      const response = await balanceService.giftPoints(giftData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to gift points");
    }
  }
);

// Slice
const balanceSlice = createSlice({
  name: "balance",
  initialState,
  reducers: {
    // Set selected restaurant balance
    setSelectedRestaurantBalance: (state, action: PayloadAction<string>) => {
      const restaurantId = action.payload;
      const balance = state.userBalances.find(
        (b) => b.restaurantId === restaurantId
      );
      state.selectedRestaurantBalance = balance || null;
    },

    // Clear selected restaurant balance
    clearSelectedRestaurantBalance: (state) => {
      state.selectedRestaurantBalance = null;
    },

    // Clear errors
    clearErrors: (state) => {
      state.error = {
        balances: null,
        qrScan: null,
        payment: null,
      };
    },

    // Clear all data
    clearBalances: (state) => {
      state.userBalances = [];
      state.selectedRestaurantBalance = null;
      state.error = {
        balances: null,
        qrScan: null,
        payment: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch user balances
    builder
      .addCase(fetchUserBalances.pending, (state) => {
        state.loading.balances = true;
        state.error.balances = null;
      })
      .addCase(fetchUserBalances.fulfilled, (state, action) => {
        state.loading.balances = false;

        // Transform API response to match our data structure
        const transformedBalances = action.payload.map((item: any) => ({
          id: item.targetId || item.id,
          userId: item.userId || "",
          restaurantId: item.targetId || item.id,
          balance: item.balance || 0,
          stars_meal: item.stars_meal || 0,
          stars_drink: item.stars_drink || 0,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          restaurant: {
            id: item.targetId || item.id,
            name: item.name || "Unknown Restaurant",
            address: item.address || "",
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            isActive: true,
            createdAt: item.createdAt || new Date().toISOString(),
          },
        }));

        state.userBalances = transformedBalances;

        // Auto-select first restaurant if none selected
        if (
          !state.selectedRestaurantBalance &&
          transformedBalances.length > 0
        ) {
          state.selectedRestaurantBalance = transformedBalances[0];
        }

        // Update selected restaurant balance if it exists
        if (state.selectedRestaurantBalance) {
          const updatedSelectedBalance = transformedBalances.find(
            (b) =>
              b.restaurantId === state.selectedRestaurantBalance?.restaurantId
          );
          if (updatedSelectedBalance) {
            state.selectedRestaurantBalance = updatedSelectedBalance;
            console.log(
              "🔄 Updated selected restaurant balance:",
              updatedSelectedBalance
            );

            // Also update the restaurantSlice
            // Note: We can't dispatch from within a reducer, so this will be handled in the component
          }
        }

        // Log the updated balances for debugging
        console.log("📊 Updated balances:", transformedBalances);
      })
      .addCase(fetchUserBalances.rejected, (state, action) => {
        state.loading.balances = false;
        state.error.balances = action.payload as string;

        // If it's an auth error, clear balances
        if (
          action.payload?.toString().includes("401") ||
          action.payload?.toString().includes("Unauthorized")
        ) {
          state.userBalances = [];
          state.selectedRestaurantBalance = null;
        }

        // If it's a network error, show a more user-friendly message
        if (
          action.payload?.toString().includes("Network Error") ||
          action.payload?.toString().includes("ENOENT")
        ) {
          state.error.balances =
            "خطأ في الاتصال بالشبكة. تحقق من اتصال الإنترنت";

          // Add fallback data for development
          if (__DEV__) {
            console.log("🔄 Using fallback data due to network error");
            const fallbackData = [
              {
                id: "fallback-1",
                userId: "fallback-user",
                restaurantId: "fallback-1",
                balance: 0,
                stars_meal: 0,
                stars_drink: 50,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                restaurant: {
                  id: "fallback-1",
                  name: "abo ali",
                  address: "Fallback Restaurant",
                  latitude: 36.020214,
                  longitude: 35.0134549,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                },
              },
            ];

            state.userBalances = fallbackData;
            state.selectedRestaurantBalance = fallbackData[0];
            state.error.balances = null; // Clear error since we have fallback data
          }
        }
      });

    // Scan QR code
    builder
      .addCase(scanQrCode.pending, (state) => {
        state.loading.qrScan = true;
        state.error.qrScan = null;
      })
      .addCase(scanQrCode.fulfilled, (state, action) => {
        state.loading.qrScan = false;
        // Refresh balances after successful scan
        // This will be handled by the component
      })
      .addCase(scanQrCode.rejected, (state, action) => {
        state.loading.qrScan = false;
        state.error.qrScan = action.payload as string;

        // Log the error for debugging
        console.log("🔍 QR Scan rejected:", action.payload);

        // Don't clear balances on QR scan error - it's not an auth error
        // The component will handle the specific error display
      });

    // Process payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.loading.payment = true;
        state.error.payment = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading.payment = false;
        // Refresh balances after successful payment
        // This will be handled by the component
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading.payment = false;
        state.error.payment = action.payload as string;
      });

    // Gift points
    builder
      .addCase(giftPoints.pending, (state) => {
        state.loading.payment = true;
        state.error.payment = null;
      })
      .addCase(giftPoints.fulfilled, (state, action) => {
        state.loading.payment = false;
        // Refresh balances after successful gift
        // This will be handled by the component
      })
      .addCase(giftPoints.rejected, (state, action) => {
        state.loading.payment = false;
        state.error.payment = action.payload as string;
      });
  },
});

export const {
  setSelectedRestaurantBalance,
  clearSelectedRestaurantBalance,
  clearErrors,
  clearBalances,
} = balanceSlice.actions;

export default balanceSlice;
