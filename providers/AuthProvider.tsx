import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { initializeAuth } from "../store/slices/authSlice";
import { View, Text, ActivityIndicator } from "react-native";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Initialize auth state from secure storage when app starts
    console.log("🚀 App starting, initializing auth...");
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: "#666",
            fontWeight: "500",
          }}
        >
          Checking authentication...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
