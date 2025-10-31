import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { RootState } from "@/store/store";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  clearProfile,
  clearError,
  setProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from "@/store/slices/profileSlice";

export const useProfile = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.profile);

  // Get profile
  const fetchProfile = useCallback(async () => {
    try {
      console.log("🔄 Fetching profile...");
      const result = await dispatch(getProfile() as any);
      return result;
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      throw error;
    }
  }, [dispatch]);

  // Update profile
  const updateUserProfile = useCallback(
    async (profileData: UpdateProfileRequest) => {
      try {
        console.log("🔄 Updating profile:", profileData);
        const result = await dispatch(updateProfile(profileData) as any);
        return result;
      } catch (error) {
        console.error("❌ Error updating profile:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Change password
  const changeUserPassword = useCallback(
    async (passwordData: ChangePasswordRequest) => {
      try {
        console.log("🔄 Changing password...");
        const result = await dispatch(changePassword(passwordData) as any);
        return result;
      } catch (error) {
        console.error("❌ Error changing password:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Delete account
  const deleteUserAccount = useCallback(
    async (deleteData: DeleteAccountRequest) => {
      try {
        console.log("🔄 Deleting account...");
        const result = await dispatch(deleteAccount(deleteData) as any);
        return result;
      } catch (error) {
        console.error("❌ Error deleting account:", error);
        throw error;
      }
    },
    [dispatch]
  );

  // Clear profile
  const clearUserProfile = useCallback(() => {
    dispatch(clearProfile());
  }, [dispatch]);

  // Clear error
  const clearProfileError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Set profile manually
  const setUserProfile = useCallback(
    (profile: any) => {
      dispatch(setProfile(profile));
    },
    [dispatch]
  );

  return {
    // State
    profile: profile.profile,
    isLoading: profile.isLoading,
    error: profile.error,
    updateLoading: profile.updateLoading,
    passwordChangeLoading: profile.passwordChangeLoading,
    deleteLoading: profile.deleteLoading,

    // Actions
    fetchProfile,
    updateUserProfile,
    changeUserPassword,
    deleteUserAccount,
    clearUserProfile,
    clearProfileError,
    setUserProfile,
  };
};
