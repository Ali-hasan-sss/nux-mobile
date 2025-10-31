import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { restaurantActivityService } from "../services/restaurantActivityService";
import { RestaurantActivityState } from "../types/restaurantActivityTypes";

const initialState: RestaurantActivityState = {
  scans: [],
  payments: [],
  scansLoading: false,
  paymentsLoading: false,
  scansError: null,
  paymentsError: null,
  scansPagination: null,
  paymentsPagination: null,
  scansLoadingMore: false,
  paymentsLoadingMore: false,
};

// Fetch QR scans
export const fetchQRScans = createAsyncThunk(
  "restaurantActivity/fetchQRScans",
  async (
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await restaurantActivityService.getQRScans(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "فشل في جلب سجل المسحات");
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في جلب سجل المسحات"
        );
      } else {
        return rejectWithValue("حدث خطأ في الشبكة");
      }
    }
  }
);

// Load more QR scans
export const loadMoreQRScans = createAsyncThunk(
  "restaurantActivity/loadMoreQRScans",
  async (
    params: {
      page: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await restaurantActivityService.getQRScans(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "فشل في جلب المزيد من المسحات"
        );
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في جلب المزيد من المسحات"
        );
      } else {
        return rejectWithValue("حدث خطأ في الشبكة");
      }
    }
  }
);

// Fetch payments
export const fetchPayments = createAsyncThunk(
  "restaurantActivity/fetchPayments",
  async (
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await restaurantActivityService.getPayments(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "فشل في جلب سجل الدفع");
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في جلب سجل الدفع"
        );
      } else {
        return rejectWithValue("حدث خطأ في الشبكة");
      }
    }
  }
);

// Load more payments
export const loadMorePayments = createAsyncThunk(
  "restaurantActivity/loadMorePayments",
  async (
    params: {
      page: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await restaurantActivityService.getPayments(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "فشل في جلب المزيد من المدفوعات"
        );
      }
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || "حدث خطأ في جلب المزيد من المدفوعات"
        );
      } else {
        return rejectWithValue("حدث خطأ في الشبكة");
      }
    }
  }
);

const restaurantActivitySlice = createSlice({
  name: "restaurantActivity",
  initialState,
  reducers: {
    clearScans: (state) => {
      state.scans = [];
      state.scansError = null;
      state.scansPagination = null;
    },
    clearPayments: (state) => {
      state.payments = [];
      state.paymentsError = null;
      state.paymentsPagination = null;
    },
  },
  extraReducers: (builder) => {
    // QR Scans - Initial fetch
    builder
      .addCase(fetchQRScans.pending, (state) => {
        state.scansLoading = true;
        state.scansError = null;
      })
      .addCase(fetchQRScans.fulfilled, (state, action) => {
        state.scansLoading = false;
        state.scans = action.payload.scans || [];
        state.scansPagination = action.payload.pagination || null;
      })
      .addCase(fetchQRScans.rejected, (state, action) => {
        state.scansLoading = false;
        state.scansError = action.payload as string;
      });

    // QR Scans - Load more
    builder
      .addCase(loadMoreQRScans.pending, (state) => {
        state.scansLoadingMore = true;
        state.scansError = null;
      })
      .addCase(loadMoreQRScans.fulfilled, (state, action) => {
        state.scansLoadingMore = false;
        state.scans = [...state.scans, ...(action.payload.scans || [])];
        state.scansPagination =
          action.payload.pagination || state.scansPagination;
      })
      .addCase(loadMoreQRScans.rejected, (state, action) => {
        state.scansLoadingMore = false;
        state.scansError = action.payload as string;
      });

    // Payments - Initial fetch
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.paymentsLoading = true;
        state.paymentsError = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload.payments || [];
        state.paymentsPagination = action.payload.pagination || null;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.paymentsLoading = false;
        state.paymentsError = action.payload as string;
      });

    // Payments - Load more
    builder
      .addCase(loadMorePayments.pending, (state) => {
        state.paymentsLoadingMore = true;
        state.paymentsError = null;
      })
      .addCase(loadMorePayments.fulfilled, (state, action) => {
        state.paymentsLoadingMore = false;
        state.payments = [
          ...state.payments,
          ...(action.payload.payments || []),
        ];
        state.paymentsPagination =
          action.payload.pagination || state.paymentsPagination;
      })
      .addCase(loadMorePayments.rejected, (state, action) => {
        state.paymentsLoadingMore = false;
        state.paymentsError = action.payload as string;
      });
  },
});

export const { clearScans, clearPayments } = restaurantActivitySlice.actions;
export default restaurantActivitySlice.reducer;
