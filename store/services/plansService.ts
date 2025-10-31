import api from "@/api/axiosInstance";
import {
  PlansResponse,
  CheckoutSessionResponse,
  ConfirmSubscriptionResponse,
} from "../types/plansTypes";

export const plansService = {
  // Get all plans
  async getPlans(): Promise<PlansResponse> {
    try {
      const response = await api.get<PlansResponse>("/plans");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching plans:", error);
      throw error;
    }
  },

  // Create checkout session
  async createCheckoutSession(
    planId: number
  ): Promise<CheckoutSessionResponse> {
    try {
      const response = await api.post<CheckoutSessionResponse>(
        "/restaurants/subscription/checkout",
        {
          planId,
          successUrl:
            "https://nuxapp.de/dashboard/subscription?status=success&session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: "https://nuxapp.de/dashboard/subscription?status=cancel",
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating checkout session:", error);
      throw error;
    }
  },

  // Confirm subscription after payment
  async confirmSubscription(
    sessionId: string
  ): Promise<ConfirmSubscriptionResponse> {
    try {
      const response = await api.post<ConfirmSubscriptionResponse>(
        "/restaurants/subscription/confirm",
        { sessionId }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error confirming subscription:", error);
      throw error;
    }
  },
};
