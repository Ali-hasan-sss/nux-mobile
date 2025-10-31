import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { profileService } from "../services/profileService";

// Types
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "RESTAURANT_OWNER" | "USER";
  isActive: boolean;
  emailVerified: boolean | null;
  createdAt: string;
  qrCode: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  updateLoading: boolean;
  passwordChangeLoading: boolean;
  deleteLoading: boolean;
}

// Initial state
const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
  updateLoading: false,
  passwordChangeLoading: false,
  deleteLoading: false,
};

// Async thunks
export const getProfile = createAsyncThunk(
  "profile/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔄 Fetching user profile...");
      const response = await profileService.getProfile();
      console.log("✅ Profile fetched successfully:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Get profile error:", error);

      let errorMessage = "Failed to fetch profile";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      console.log("🔄 Updating profile:", profileData);
      const response = await profileService.updateProfile(profileData);
      console.log("✅ Profile updated successfully:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Update profile error:", error);

      let errorMessage = "Failed to update profile";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const changePassword = createAsyncThunk(
  "profile/changePassword",
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      console.log("🔄 Changing password...");
      const response = await profileService.changePassword(passwordData);
      console.log("✅ Password changed successfully");
      return response;
    } catch (error: any) {
      console.error("❌ Change password error:", error);

      let errorMessage = "Failed to change password";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  "profile/deleteAccount",
  async (deleteData: DeleteAccountRequest, { rejectWithValue }) => {
    try {
      console.log("🔄 Deleting account...");
      const response = await profileService.deleteAccount(deleteData);
      console.log("✅ Account deleted successfully");
      return response;
    } catch (error: any) {
      console.error("❌ Delete account error:", error);

      let errorMessage = "Failed to delete account";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log("🔄 Getting profile...");
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
        console.log("✅ Profile retrieved successfully");
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error("❌ Failed to get profile:", action.payload);
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        console.log("🔄 Updating profile...");
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.profile = action.payload;
        state.error = null;
        console.log("✅ Profile updated successfully");
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
        console.error("❌ Failed to update profile:", action.payload);
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.passwordChangeLoading = true;
        state.error = null;
        console.log("🔄 Changing password...");
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordChangeLoading = false;
        state.error = null;
        console.log("✅ Password changed successfully");
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChangeLoading = false;
        state.error = action.payload as string;
        console.error("❌ Failed to change password:", action.payload);
      });

    // Delete Account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
        console.log("🔄 Deleting account...");
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.deleteLoading = false;
        state.profile = null;
        state.error = null;
        console.log("✅ Account deleted successfully");
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
        console.error("❌ Failed to delete account:", action.payload);
      });
  },
});

export const { clearProfile, clearError, setProfile } = profileSlice.actions;
export default profileSlice;
