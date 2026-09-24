/**
 * Headers sent on every mobile → backend request.
 * CORS does not apply to React Native; this identifies the app to the API.
 */
export function getMobileApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Channel": "mobile",
  };

  const apiKey = process.env.EXPO_PUBLIC_MOBILE_API_KEY?.trim();
  if (apiKey) {
    headers["X-Mobile-Api-Key"] = apiKey;
  }

  return headers;
}
