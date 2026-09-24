import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { adsService } from "../services/adsService";
import { AdsState, AdsFilters, Ad } from "../types/adsTypes";
import { NETWORK_ERROR_MESSAGE, isNetworkError } from "@/lib/networkError";

// Initial state
const initialState: AdsState = {
  ads: [],
  pagination: null,
  filters: {
    page: 1,
    pageSize: 10,
  },
  loading: false,
  refreshing: false,
  error: null,
};

// Async thunks
export const fetchAds = createAsyncThunk(
  "ads/fetchAds",
  async (
    { filters, append = false }: { filters: AdsFilters; append?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await adsService.getAds(filters);
      if (response.success) {
        return { data: response.data, append };
      } else {
        return rejectWithValue(response.message || "فشل في جلب الإعلانات");
      }
    } catch (error: any) {
      if (isNetworkError(error)) {
        return rejectWithValue(NETWORK_ERROR_MESSAGE);
      }
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to load ads"
        );
      }
      return rejectWithValue("Something went wrong. Please try again.");
    }
  }
);

export const refreshAds = createAsyncThunk(
  "ads/refreshAds",
  async (filters: AdsFilters, { rejectWithValue }) => {
    try {
      const response = await adsService.getAds({ ...filters, page: 1 });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "فشل في تحديث الإعلانات");
      }
    } catch (error: any) {
      if (isNetworkError(error)) {
        return rejectWithValue(NETWORK_ERROR_MESSAGE);
      }
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to refresh ads"
        );
      }
      return rejectWithValue("Something went wrong. Please try again.");
    }
  }
);

// Get restaurant's own ads
export const fetchRestaurantAds = createAsyncThunk(
  "ads/fetchRestaurantAds",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adsService.getRestaurantAds();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "فشل في جلب الإعلانات");
      }
    } catch (error: any) {
      if (isNetworkError(error)) {
        return rejectWithValue(NETWORK_ERROR_MESSAGE);
      }
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to load ads"
        );
      }
      return rejectWithValue("Something went wrong. Please try again.");
    }
  }
);

// Delete restaurant ad
export const deleteRestaurantAd = createAsyncThunk(
  "ads/deleteRestaurantAd",
  async (adId: number, { rejectWithValue }) => {
    try {
      const response = await adsService.deleteAd(adId);
      if (response.success) {
        return adId;
      } else {
        return rejectWithValue(response.message || "فشل في حذف الإعلان");
      }
    } catch (error: any) {
      if (isNetworkError(error)) {
        return rejectWithValue(NETWORK_ERROR_MESSAGE);
      }
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "Failed to delete ad"
        );
      }
      return rejectWithValue("Something went wrong. Please try again.");
    }
  }
);

// Ads slice
const adsSlice = createSlice({
  name: "ads",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AdsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        pageSize: 10,
      };
    },
    clearAds: (state) => {
      state.ads = [];
      state.pagination = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    addAd: (state, action: PayloadAction<Ad>) => {
      // Add new ad to the beginning of the list
      state.ads = [action.payload, ...(state.ads || [])];
    },
  },
  extraReducers: (builder) => {
    // Fetch ads
    builder
      .addCase(fetchAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAds.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.append) {
          // Append ads for pagination
          state.ads = [...state.ads, ...action.payload.data.ads];
        } else {
          // Replace ads for new search/filter
          state.ads = action.payload.data.ads;
        }

        state.pagination = action.payload.data.pagination;
        state.filters.page = action.payload.data.pagination.currentPage;
      })
      .addCase(fetchAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh ads
    builder
      .addCase(refreshAds.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshAds.fulfilled, (state, action) => {
        state.refreshing = false;
        state.ads = action.payload.ads;
        state.pagination = action.payload.pagination;
        state.filters.page = 1;
      })
      .addCase(refreshAds.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      });

    // Fetch restaurant ads
    builder
      .addCase(fetchRestaurantAds.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Don't clear ads on pending to avoid flickering
      })
      .addCase(fetchRestaurantAds.fulfilled, (state, action) => {
        state.loading = false;
        // Always update with the response, even if empty array
        // This ensures we show the correct state after refresh
        if (action.payload) {
          state.ads = Array.isArray(action.payload.ads)
            ? action.payload.ads
            : action.payload.ads || [];
          state.pagination = action.payload.pagination || null;
        } else {
          // If payload is invalid, set to empty array (no ads found)
          state.ads = [];
          state.pagination = null;
        }
      })
      .addCase(fetchRestaurantAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete restaurant ad
    builder
      .addCase(deleteRestaurantAd.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteRestaurantAd.fulfilled, (state, action) => {
        state.loading = false;
        // Remove deleted ad from state
        state.ads = (state.ads || []).filter((ad) => ad.id !== action.payload);
      })
      .addCase(deleteRestaurantAd.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearAds, clearError, addAd } =
  adsSlice.actions;
export default adsSlice.reducer;
