import { authApi } from "../../api/authApi";
import {
  LoginRequest,
  RegisterUserRequest,
  AuthResponse,
  AuthTokens,
} from "../types/authTypes";

export const authService = {
  // User login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log("🔐 Attempting login for:", credentials.email);
      const response = await authApi.post("/auth/login", credentials);
      console.log("✅ Login successful");
      return {
        user: response.data.data.user,
        restaurant: response.data.data.restaurant,
        tokens: response.data.data.tokens,
      };
    } catch (error: any) {
      console.error("❌ Login failed:", error);

      // Handle network errors
      if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("Network Error")
      ) {
        throw new Error(
          "Network Error - Please check your internet connection"
        );
      }

      // Handle other errors
      throw error;
    }
  },

  // User registration
  async registerUser(userData: RegisterUserRequest): Promise<AuthResponse> {
    console.log("📝 Attempting user registration for:", userData.email);
    const response = await authApi.post("/auth/register", userData);
    console.log("✅ User registration successful");
    return {
      user: response.data.data.user,
      tokens: response.data.data.tokens,
    };
  },

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    console.log("🔄 Refreshing tokens...");
    const response = await authApi.post("/auth/refresh", { refreshToken });
    console.log("✅ Tokens refreshed");
    return response.data.data;
  },

  // Send verification code
  async sendVerificationCode(email: string): Promise<void> {
    console.log("📧 Sending verification code to:", email);
    await authApi.post("/auth/send-verification-code", { email });
    console.log("✅ Verification code sent");
  },

  // Verify email
  async verifyEmail(email: string, code: string): Promise<void> {
    console.log("✉️ Verifying email for:", email);
    await authApi.post("/auth/verify-email", { email, code });
    console.log("✅ Email verified");
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    console.log("🔑 Requesting password reset for:", email);
    await authApi.post("/auth/request-password-reset", { email });
    console.log("✅ Password reset requested");
  },

  // Reset password
  async resetPassword(
    email: string,
    resetCode: string,
    newPassword: string
  ): Promise<void> {
    console.log("🔑 Resetting password for:", email);
    await authApi.post("/auth/reset-password", {
      email,
      resetCode,
      newPassword,
    });
    console.log("✅ Password reset successful");
  },
};
