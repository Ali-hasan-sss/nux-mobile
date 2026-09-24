import axios from "axios";
import { API_CONFIG } from "@/config/api";
import { getMobileApiHeaders } from "@/config/apiHeaders";
import { getClientDeviceIdHeader } from "@/lib/attachDeviceIdInterceptor";
import {
  resolveLegalLocale,
  type LegalLocale,
  type LegalPageType,
} from "@/config/website";

export async function fetchPublicLegalHtml(
  type: LegalPageType,
  lang?: string
): Promise<string> {
  const locale: LegalLocale = resolveLegalLocale(lang);
  const url = `${API_CONFIG.BASE_URL}/public/legal/${type}`;
  if (__DEV__) {
    console.log("[Legal] GET", url, { locale });
  }
  const res = await axios.get(url, {
    params: { locale },
    timeout: API_CONFIG.TIMEOUT,
    headers: { ...getMobileApiHeaders(), ...(await getClientDeviceIdHeader()) },
  });
  const content = res.data?.data?.content;
  return typeof content === "string" ? content : "";
}
