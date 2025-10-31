export interface PlanPermission {
  id: number;
  type: string;
  value: number | null;
  isUnlimited: boolean;
}

export interface Plan {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  isActive: boolean;
  stripePriceId: string | null;
  permissions: PlanPermission[];
}

export interface PlansResponse {
  success: boolean;
  message: string;
  data: Plan[];
}

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    id: string;
  };
}

export interface ConfirmSubscriptionResponse {
  success: boolean;
  message: string;
  data: {
    subscriptionId: string;
  };
}

export interface PlansState {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  checkoutLoading: boolean;
  confirmLoading: boolean;
}
