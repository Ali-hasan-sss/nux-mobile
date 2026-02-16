import axios from "axios";
import { API_CONFIG } from "../config/api";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Public API for contact form (no auth). Same backend as website. */
const contactClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

export async function sendContactMessage(
  data: ContactFormData
): Promise<{ success: boolean; message?: string }> {
  const response = await contactClient.post(
    API_CONFIG.ENDPOINTS.CONTACT.SEND,
    data
  );
  return response.data;
}
