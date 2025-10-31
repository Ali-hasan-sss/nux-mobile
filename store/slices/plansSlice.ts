import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { plansService } from "../services/plansService";
import { PlansState } from "../types/plansTypes";

const initialState: PlansState = {
  plans: [],
  loading: false,
  error: null,
  checkoutLoading: false,
  confirmLoading: false,
};

// Fetch all plans
export const fetchPlans = createAsyncThunk(
  "plans/fetchPlans",
  async (_, { rejectWithValue }) => {
    try {
      const response = await plansService.getPlans();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to fetch plans");
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching plans"
      );
    }
  }
);

// Create checkout session
export const createCheckoutSession = createAsyncThunk(
  "plans/createCheckoutSession",
  async (planId: number, { rejectWithValue }) => {
    try {
      const response = await plansService.createCheckoutSession(planId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Failed to create checkout session"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error creating checkout session"
      );
    }
  }
);

// Confirm subscription
export const confirmSubscription = createAsyncThunk(
  "plans/confirmSubscription",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await plansService.confirmSubscription(sessionId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Failed to confirm subscription"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Error confirming subscription"
      );
    }
  }
);

const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPlans: (state) => {
      state.plans = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch plans
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create checkout session
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.checkoutLoading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.checkoutLoading = false;
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload as string;
      });

    // Confirm subscription
    builder
      .addCase(confirmSubscription.pending, (state) => {
        state.confirmLoading = true;
        state.error = null;
      })
      .addCase(confirmSubscription.fulfilled, (state) => {
        state.confirmLoading = false;
      })
      .addCase(confirmSubscription.rejected, (state, action) => {
        state.confirmLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearPlans } = plansSlice.actions;
export default plansSlice.reducer;
