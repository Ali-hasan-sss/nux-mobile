import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { initializeAuth } from "../store/slices/authSlice";
import { getProfile } from "../store/slices/profileSlice";
import { View } from "react-native";
import { router, useSegments } from "expo-router";
import { BouncingLogoLoader } from "../components/BouncingLogoLoader";
import { AnimatedBackground } from "../components/AnimatedBackground";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const profileFetchedRef = useRef(false);
  const segments = useSegments();
  const wasAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    // Initialize auth state from secure storage when app starts
    console.log("🚀 App starting, initializing auth...");
    dispatch(initializeAuth());
  }, [dispatch]);

  // Fetch user profile when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && !isLoading && !profileFetchedRef.current) {
      console.log("🔄 User authenticated, fetching profile...");
      dispatch(getProfile());
      profileFetchedRef.current = true;
    }

    // Reset flag when user logs out
    if (!isAuthenticated) {
      profileFetchedRef.current = false;
    }
  }, [isAuthenticated, isLoading, dispatch]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedBackground>
          <BouncingLogoLoader size={120} message="Checking authentication..." />
        </AnimatedBackground>
      </View>
    );
  }

  return <>{children}</>;
};
