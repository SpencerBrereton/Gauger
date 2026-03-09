import { create } from "zustand";
import client from "../api/client";
import storage from "../utils/storage";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitializing: true,
  isAuthenticated: false,

  /**
   * Restore token from storage on app launch
   */
  initialize: async () => {
    const token = await storage.getToken();
    if (token) {
      set({ token, isAuthenticated: true });
    }
    set({ isInitializing: false });
  },

  /**
   * Sign in: POST /api/v1/users/sign_in
   * JWT is returned in the Authorization response header by devise-jwt
   */
  signIn: async (email, password) => {
    set({ isLoading: true });
    console.log("Attempting sign in for:", email);
    try {
      const response = await client.post("/users/sign_in", {
        user: { email, password },
      });

      console.log("Sign in successful, extracting token...");
      const token = response.headers["authorization"]?.replace("Bearer ", "");
      const user = response.data.user;

      if (!token) {
        console.warn("No Authorization header found in response. Check CORS settings.");
      }

      await storage.setToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error("Sign in error:", error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response received. Check network connectivity and API URL.");
      }
      set({ isLoading: false });
      const message =
        error.response?.data?.error || "Invalid email or password.";
      return { success: false, error: message };
    }
  },

  /**
   * Register: POST /api/v1/users/sign_up
   */
  signUp: async (email, password, passwordConfirmation) => {
    set({ isLoading: true });
    try {
      const response = await client.post("/users/sign_up", {
        user: { email, password, password_confirmation: passwordConfirmation },
      });

      const token = response.headers["authorization"]?.replace("Bearer ", "");
      const user = response.data.user;

      await storage.setToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      const errors = error.response?.data?.errors || ["Registration failed."];
      return { success: false, errors };
    }
  },

  /**
   * Sign out: DELETE /api/v1/users/sign_out, then clear local state
   */
  signOut: async () => {
    try {
      await client.delete("/users/sign_out");
    } catch (_) {
      // Ignore errors — clear locally regardless
    }
    await storage.removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
