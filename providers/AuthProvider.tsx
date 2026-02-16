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

  // Show loading screen only during initial auth check (from storage), not during login/register.
  // When user is on auth screen (login/register), keep the screen mounted so error messages can be shown.
  const segmentStrings = Array.isArray(segments) ? (segments as string[]) : [];
  const inAuthScreen = segmentStrings.some((s) => s === "auth");
  const showInitialLoader = isLoading && !inAuthScreen;

  if (showInitialLoader) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedBackground>
          <BouncingLogoLoader size={120} />
        </AnimatedBackground>
      </View>
    );
  }

  return <>{children}</>;
};
