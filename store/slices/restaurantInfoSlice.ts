import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { restaurantInfoService } from "../services/restaurantInfoService";
import {
  RestaurantInfo,
  UpdateRestaurantInfoPayload,
} from "../types/restaurantInfoTypes";

interface RestaurantInfoState {
  info: RestaurantInfo | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: RestaurantInfoState = {
  info: null,
  loading: false,
  updating: false,
  error: null,
};

// Fetch restaurant info
export const fetchRestaurantInfo = createAsyncThunk(
  "restaurantInfo/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await restaurantInfoService.getRestaurantInfo();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Failed to fetch restaurant info"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching restaurant info"
      );
    }
  }
);

// Update restaurant info
export const updateRestaurantInfo = createAsyncThunk(
  "restaurantInfo/update",
  async (data: UpdateRestaurantInfoPayload, { rejectWithValue }) => {
    try {
      const response = await restaurantInfoService.updateRestaurantInfo(data);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Failed to update restaurant info"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error updating restaurant info"
      );
    }
  }
);

const restaurantInfoSlice = createSlice({
  name: "restaurantInfo",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRestaurantInfo: (state) => {
      state.info = null;
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
      })
      .addCase(fetchRestaurantInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update restaurant info
    builder
      .addCase(updateRestaurantInfo.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateRestaurantInfo.fulfilled, (state, action) => {
        state.updating = false;
        state.info = action.payload;
      })
      .addCase(updateRestaurantInfo.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearRestaurantInfo } = restaurantInfoSlice.actions;
export default restaurantInfoSlice.reducer;
