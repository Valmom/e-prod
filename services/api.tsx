// services/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: "https://mipi.equatorialenergia.com.br/mipiapi/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const stored = await SecureStore.getItemAsync("mipi-user-data");

      if (stored) {
        const userData = JSON.parse(stored);

        if (userData?.accessToken) {
          config.headers.Authorization = `Bearer ${userData.accessToken}`;
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar token:", error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);