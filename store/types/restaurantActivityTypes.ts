export interface QRScan {
  id: number;
  userId: string;
  restaurantId: string;
  type: "drink" | "meal";
  pointsAwarded: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

export interface Payment {
  id: string;
  userId: string;
  restaurantId: string;
  amount: number;
  paymentType: "balance" | "stars_meal" | "stars_drink";
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

export interface QRScansResponse {
  success: boolean;
  message: string;
  data: {
    scans: QRScan[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PaymentsResponse {
  success: boolean;
  message: string;
  data: {
    payments: Payment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RestaurantActivityState {
  scans: QRScan[];
  payments: Payment[];
  scansLoading: boolean;
  paymentsLoading: boolean;
  scansError: string | null;
  paymentsError: string | null;
  scansPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  paymentsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  scansLoadingMore: boolean;
  paymentsLoadingMore: boolean;
}
