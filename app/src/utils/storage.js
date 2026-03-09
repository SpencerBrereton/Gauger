import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "gauger_auth_token";

/**
 * Platform-aware token storage.
 * - Native (Android): uses expo-secure-store (encrypted keystore)
 * - Web: uses localStorage (no secure-store support on web)
 */
const storage = {
  async getToken() {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token) {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },

  async removeToken() {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },

  async getItem(key) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default storage;
