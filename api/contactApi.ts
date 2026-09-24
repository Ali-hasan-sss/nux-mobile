import axios from "axios";
import { API_CONFIG } from "../config/api";
import { getMobileApiHeaders } from "../config/apiHeaders";
import { attachDeviceIdInterceptor } from "../lib/attachDeviceIdInterceptor";

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
  headers: getMobileApiHeaders(),
});

attachDeviceIdInterceptor(contactClient);

export async function sendContactMessage(
  data: ContactFormData
): Promise<{ success: boolean; message?: string }> {
  const response = await contactClient.post(
    API_CONFIG.ENDPOINTS.CONTACT.SEND,
    data
  );
  return response.data;
}
