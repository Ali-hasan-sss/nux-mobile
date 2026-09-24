import { authApi } from "../../api/authApi";
import {
  LoginRequest,
  RegisterUserRequest,
  AuthResponse,
  AuthTokens,
} from "../types/authTypes";
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/networkError";

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
      if (isNetworkError(error)) {
        throw new Error(NETWORK_ERROR_MESSAGE);
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

  /** Same contract as website: backend verifies idToken with GOOGLE_CLIENT_ID (Web client ID). */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    console.log("🔐 Google sign-in: exchanging id token with API");
    const response = await authApi.post("/auth/google", { idToken });
    console.log("✅ Google sign-in API OK");
    return {
      user: response.data.data.user,
      restaurant: response.data.data.restaurant ?? null,
      tokens: response.data.data.tokens,
    };
  },

  /** Native Sign in with Apple — backend verifies identityToken (audience = Bundle ID). */
  async loginWithApple(payload: {
    identityToken: string;
    email?: string | null;
    fullName?: {
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  }): Promise<AuthResponse> {
    console.log("🔐 Apple sign-in: exchanging identity token with API");
    const response = await authApi.post("/auth/apple", {
      identityToken: payload.identityToken,
      email: payload.email ?? undefined,
      fullName: payload.fullName
        ? {
            givenName: payload.fullName.givenName ?? undefined,
            familyName: payload.fullName.familyName ?? undefined,
          }
        : undefined,
    });
    console.log("✅ Apple sign-in API OK");
    return {
      user: response.data.data.user,
      restaurant: response.data.data.restaurant ?? null,
      tokens: response.data.data.tokens,
    };
  },
};
