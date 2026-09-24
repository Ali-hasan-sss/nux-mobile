import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getOrCreateClientDeviceId } from "./deviceId";

let cachedDeviceId: string | null = null;
let deviceIdPromise: Promise<string> | null = null;

function resolveDeviceId(): Promise<string> {
  if (cachedDeviceId) return Promise.resolve(cachedDeviceId);
  if (!deviceIdPromise) {
    deviceIdPromise = getOrCreateClientDeviceId().then((id) => {
      cachedDeviceId = id;
      return id;
    });
  }
  return deviceIdPromise;
}

/** Sends X-Device-Id on every request so rate limits are per device, not per shared IP. */
export function attachDeviceIdInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const id = await resolveDeviceId();
      if (config.headers && typeof (config.headers as { set?: unknown }).set === "function") {
        config.headers.set("X-Device-Id", id);
      } else {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)["X-Device-Id"] = id;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

export async function getClientDeviceIdHeader(): Promise<Record<string, string>> {
  const id = await resolveDeviceId();
  return { "X-Device-Id": id };
}
