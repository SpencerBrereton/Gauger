import axios from "axios";
import Constants from "expo-constants";
import storage from "../utils/storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "https://gauger.onrender.com/api/v1";

console.log("[API] Base URL:", API_BASE_URL);

export const BASE_URL = API_BASE_URL.replace("/api/v1", "");

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 45000,
});

// Request interceptor: attach JWT token to every request
client.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: clear token and redirect on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeToken();
      // Navigation to Login is handled by the auth store listener in AppNavigator
    }
    return Promise.reject(error);
  }
);

export default client;
