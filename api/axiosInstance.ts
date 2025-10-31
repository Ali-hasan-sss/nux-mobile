import axios from "axios";
import { CrossPlatformStorage } from "../store/services/crossPlatformStorage";

const DOMAIN = "https://back.nuxapp.de";
const api = axios.create({
  baseURL: `${DOMAIN}/api`,
  timeout: 10000,
});
// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   timeout: 10000,
// });

api.interceptors.request.use(async (config) => {
  try {
    const tokens = await CrossPlatformStorage.getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  } catch (error) {
    console.error("❌ Failed to get token for request:", error);
  }
  return config;
});

export default api;
