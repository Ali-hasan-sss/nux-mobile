import { authApi } from "../../api/authApi";
import {
  Profile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from "../slices/profileSlice";

export const profileService = {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<Profile> {
    try {
      console.log("📡 Fetching profile from API...");
      const response = await authApi.get("/client/account/me");

      console.log(
        "📡 Profile API response:",
        JSON.stringify(response.data, null, 2)
      );
      console.log(
        "📡 Profile data:",
        JSON.stringify(response.data.data, null, 2)
      );
      console.log("📡 QR Code in response:", response.data.data?.qrCode);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch profile");
      }
    } catch (error: any) {
      console.error("❌ Profile service error:", error);

      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || "Server error";
        console.error("❌ Server error:", errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        console.error("❌ Network error: No response received");
        throw new Error("NETWORK_ERROR");
      } else {
        // Something else happened
        console.error("❌ Request setup error:", error.message);
        throw new Error(error.message || "Request failed");
      }
    }
  },

  /**
   * Update user's profile (full name or email)
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<Profile> {
    try {
      console.log("📡 Updating profile via API:", profileData);
      const response = await authApi.put("/client/account/me", profileData);

      console.log(
        "📡 Update profile API response:",
        JSON.stringify(response.data, null, 2)
      );
      console.log(
        "📡 Updated profile data:",
        JSON.stringify(response.data.data, null, 2)
      );
      console.log("📡 QR Code after update:", response.data.data?.qrCode);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("❌ Update profile service error:", error);

      if (error.response) {
        const errorMessage = error.response.data?.message || "Server error";
        console.error("❌ Server error:", errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error("❌ Network error: No response received");
        throw new Error("NETWORK_ERROR");
      } else {
        console.error("❌ Request setup error:", error.message);
        throw new Error(error.message || "Request failed");
      }
    }
  },

  /**
   * Change user's password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      console.log("📡 Changing password via API...");
      const response = await authApi.put(
        "/client/account/me/change-password",
        passwordData
      );

      console.log("📡 Change password API response:", response.data);

      if (response.data.success) {
        return;
      } else {
        throw new Error(response.data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("❌ Change password service error:", error);

      if (error.response) {
        const errorMessage = error.response.data?.message || "Server error";
        console.error("❌ Server error:", errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error("❌ Network error: No response received");
        throw new Error("NETWORK_ERROR");
      } else {
        console.error("❌ Request setup error:", error.message);
        throw new Error(error.message || "Request failed");
      }
    }
  },

  /**
   * Delete user's account
   */
  async deleteAccount(deleteData: DeleteAccountRequest): Promise<void> {
    try {
      console.log("📡 Deleting account via API...");
      const response = await authApi.delete("/client/account/me", {
        data: deleteData,
      });

      console.log("📡 Delete account API response:", response.data);

      if (response.data.success) {
        return;
      } else {
        throw new Error(response.data.message || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("❌ Delete account service error:", error);

      if (error.response) {
        const errorMessage = error.response.data?.message || "Server error";
        console.error("❌ Server error:", errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error("❌ Network error: No response received");
        throw new Error("NETWORK_ERROR");
      } else {
        console.error("❌ Request setup error:", error.message);
        throw new Error(error.message || "Request failed");
      }
    }
  },
};
