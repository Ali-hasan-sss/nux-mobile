import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { restaurantQRService } from "../services/restaurantQRService";
import { RestaurantState } from "../types/restaurantTypes";

// Initial state
const initialState: RestaurantState = {
  info: null,
  loading: false,
  error: null,
  autoRefreshEnabled: false,
};

// Async thunks
export const fetchRestaurantInfo = createAsyncThunk(
  "restaurantQR/fetchRestaurantInfo",
  async (_, { rejectWithValue }) => {
    try {
      const response = await restaurantQRService.getRestaurantInfo();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "فشل في جلب بيانات المطعم");
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في جلب بيانات المطعم"
        );
      } else if (error.request) {
        return rejectWithValue("حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى");
      } else {
        return rejectWithValue("حدث خطأ غير متوقع");
      }
    }
  }
);

export const regenerateQRCodes = createAsyncThunk(
  "restaurantQR/regenerateQRCodes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await restaurantQRService.regenerateQRCodes();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "فشل في إعادة توليد الأكواد"
        );
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في إعادة توليد الأكواد"
        );
      } else {
        return rejectWithValue("حدث خطأ في الشبكة");
      }
    }
  }
);

// Restaurant QR slice
const restaurantQRSlice = createSlice({
  name: "restaurantQR",
  initialState,
  reducers: {
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshEnabled = action.payload;
    },
    clearRestaurantInfo: (state) => {
      state.info = null;
      state.error = null;
      state.autoRefreshEnabled = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch restaurant info
    builder
      .addCase(fetchRestaurantInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.info = action.payload;
        console.log("✅ Restaurant info fetched and stored:", {
          name: action.payload.name,
          qrCode_drink: action.payload.qrCode_drink,
          qrCode_meal: action.payload.qrCode_meal,
        });
      })
      .addCase(fetchRestaurantInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Regenerate QR codes
    builder
      .addCase(regenerateQRCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(regenerateQRCodes.fulfilled, (state, action) => {
        state.loading = false;
        // Update QR codes - if info exists, update it; otherwise set the entire info
        if (state.info) {
          state.info.qrCode_drink = action.payload.qrCode_drink;
          state.info.qrCode_meal = action.payload.qrCode_meal;
        } else {
          // If info doesn't exist, set the entire payload as info
          state.info = action.payload;
        }
        console.log("✅ QR codes regenerated:", {
          qrCode_drink: action.payload.qrCode_drink,
          qrCode_meal: action.payload.qrCode_meal,
        });
      })
      .addCase(regenerateQRCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setAutoRefresh, clearRestaurantInfo, clearError } =
  restaurantQRSlice.actions;
export default restaurantQRSlice.reducer;
