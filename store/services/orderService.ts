import { API_CONFIG } from "@/config/api";
import axios from "axios";

const publicApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

export interface OrderItemPayload {
  id: number;
  title: string;
  description?: string;
  image?: string;
  price: number;
  quantity: number;
  selectedExtras?: Array<{ name: string; price?: number; calories?: number }>;
  notes?: string;
  preparationTime?: number;
  baseCalories?: number;
  allergies?: string[];
  kitchenSection?: { id: number; name: string; description?: string };
}

export type OrderTypeValue = "ON_TABLE" | "TAKE_AWAY";

export interface CreateOrderPayload {
  restaurantId: string;
  tableNumber?: number | null;
  orderType?: OrderTypeValue;
  items: OrderItemPayload[];
  totalPrice: number;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<OrderResponse["data"]> {
    const res = await publicApi.post<OrderResponse>(
      API_CONFIG.ENDPOINTS.ORDERS.CREATE,
      payload
    );
    return res.data?.data;
  },
};
